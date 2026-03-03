import {
  createChildBlock,
  getChildBlock,
  getOrCreateBlockOnPage,
  getOrCreateChildBlock,
  getOrCreatePage,
} from '~/queries/utils';

/**
 * Marks a card as archived by adding an `archived:: true` child block
 * to the card's data entry: roam/memo > data > ((refUid)) > archived:: true
 */
export const archiveCard = async ({
  refUid,
  dataPageTitle,
}: {
  refUid: string;
  dataPageTitle: string;
}) => {
  await getOrCreatePage(dataPageTitle);
  const dataBlockUid = await getOrCreateBlockOnPage(dataPageTitle, 'data', -1, {
    open: false,
    heading: 3,
  });

  const cardDataBlockUid = await getOrCreateChildBlock(dataBlockUid, `((${refUid}))`, 0, {
    open: false,
  });

  const existingArchiveBlock = getChildBlock(cardDataBlockUid, 'archived::', {
    exactMatch: false,
  });

  if (!existingArchiveBlock) {
    await createChildBlock(cardDataBlockUid, 'archived:: true', -1);
  }
};

export const archivedCardsQuery = `[
    :find ?cardString
    :in $ ?pageTitle
    :where
      [?page :node/title ?pageTitle]
      [?page :block/children ?dataBlock]
      [?dataBlock :block/string "data"]
      [?dataBlock :block/children ?cardBlock]
      [?cardBlock :block/children ?childBlock]
      [?childBlock :block/string ?childString]
      [(clojure.string/starts-with? ?childString "archived:: true")]
      [?cardBlock :block/string ?cardString]
  ]`;

/**
 * Returns a Set of card UIDs that have been archived.
 * Queries the plugin data page for card blocks with an `archived:: true` child.
 */
export const getArchivedCardUids = async ({
  dataPageTitle,
}: {
  dataPageTitle: string;
}): Promise<Set<string>> => {
  const archivedUids = new Set<string>();

  try {
    const results = window.roamAlphaAPI.q(archivedCardsQuery, dataPageTitle);
    if (!results || !results.length) return archivedUids;

    for (const [cardString] of results) {
      const match = cardString.match(/\(\((.+?)\)\)/);
      if (match) {
        archivedUids.add(match[1]);
      }
    }
  } catch (e) {
    console.error('Error fetching archived card UIDs', e);
  }

  return archivedUids;
};
