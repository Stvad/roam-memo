import { addTagToCard, removeTagFromCard, getCardUidsWithTag } from '~/queries/tags';

export const ARCHIVE_TAG = 'memo/archived';

/**
 * Marks a card as archived by adding [[memo/archived]] tag to its data entry.
 */
export const archiveCard = async ({
  refUid,
  dataPageTitle,
}: {
  refUid: string;
  dataPageTitle: string;
}) => {
  await addTagToCard({ refUid, dataPageTitle, tag: ARCHIVE_TAG });
};

/**
 * Unarchives a card by removing [[memo/archived]] tag from its data entry.
 */
export const unarchiveCard = async ({
  refUid,
  dataPageTitle,
}: {
  refUid: string;
  dataPageTitle: string;
}) => {
  await removeTagFromCard({ refUid, dataPageTitle, tag: ARCHIVE_TAG });
};

/**
 * Returns a Set of card UIDs that have been archived.
 */
export const getArchivedCardUids = async ({
  dataPageTitle,
}: {
  dataPageTitle: string;
}): Promise<Set<string>> => {
  return getCardUidsWithTag({ dataPageTitle, tag: ARCHIVE_TAG });
};
