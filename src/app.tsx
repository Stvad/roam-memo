import * as React from 'react';
import * as Blueprint from '@blueprintjs/core';
import PracticeOverlay from '~/components/overlay/PracticeOverlay';
import SidePannelWidget from '~/components/SidePanelWidget';
import practice from '~/practice';
import { archiveCard } from '~/queries';
import usePracticeData from '~/hooks/usePracticeData';
import useTags from '~/hooks/useTags';
import useSettings from '~/hooks/useSettings';
import useCollapseReferenceList from '~/hooks/useCollapseReferenceList';
import useOnBlockInteract from '~/hooks/useOnBlockInteract';
import useCommandPaletteAction from '~/hooks/useCommandPaletteAction';
import useCachedData from '~/hooks/useCachedData';
import useOnVisibilityStateChange from '~/hooks/useOnVisibilityStateChange';
import { IntervalMultiplierType, ReviewModes } from '~/models/session';
import { RenderMode } from '~/models/practice';
import { SessionFilterConfig } from '~/queries/data';

export interface handlePracticeProps {
  refUid: string;
  grade: number;
  reviewMode: ReviewModes;
  intervalMultiplier: number;
  intervalMultiplierType: IntervalMultiplierType;
}

const parseExclusionTags = (globalExclusionTags: string): string[] =>
  globalExclusionTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

const App = () => {
  const [showPracticeOverlay, setShowPracticeOverlay] = React.useState(false);
  const [isCramming, setIsCramming] = React.useState(false);

  const { tagsListString, dataPageTitle, dailyLimit, rtlEnabled, shuffleCards, globalExclusionTags } = useSettings();
  const { selectedTag, setSelectedTag, tagsList } = useTags({ tagsListString });

  const { fetchCacheData, saveCacheData, data: cachedData } = useCachedData({ dataPageTitle });

  // Session filter state — initialized from global exclusion tags, reset when overlay opens
  const [sessionFilter, setSessionFilter] = React.useState<SessionFilterConfig>({
    includeTags: [],
    excludeTags: parseExclusionTags(globalExclusionTags),
  });

  // Keep session filter in sync when global exclusion tags setting changes
  React.useEffect(() => {
    setSessionFilter((prev) => ({
      ...prev,
      excludeTags: parseExclusionTags(globalExclusionTags),
    }));
  }, [globalExclusionTags]);

  const { practiceData, today, fetchPracticeData } = usePracticeData({
    tagsList,
    selectedTag,
    dataPageTitle,
    cachedData,
    isCramming,
    dailyLimit,
    shuffleCards,
    sessionFilter,
  });

  const handlePracticeClick = async ({ refUid, ...cardData }: handlePracticeProps) => {
    if (!refUid) {
      console.error('HandlePracticeFn Error: No refUid provided');
      return;
    }

    try {
      await practice({
        ...cardData,
        dataPageTitle,
        dateCreated: new Date(),
        refUid,
        isCramming,
      });
    } catch (error) {
      console.error('Error Saving Practice Data', error);
    }
  };

  const handleArchiveClick = async (refUid: string) => {
    if (!refUid) {
      console.error('HandleArchiveFn Error: No refUid provided');
      return;
    }

    try {
      await archiveCard({ refUid, dataPageTitle });
    } catch (error) {
      console.error('Error Archiving Card', error);
    }
  };

  const setRenderMode = (tag: string, mode: RenderMode) => {
    saveCacheData({ renderMode: mode }, { selectedTag: tag });
    fetchCacheData();
  };

  const refreshData = () => {
    fetchCacheData();
    fetchPracticeData();
  };

  useOnVisibilityStateChange(() => {
    if (showPracticeOverlay) return;
    refreshData();
  });

  const onShowPracticeOverlay = () => {
    // Reset session filter to defaults when opening
    setSessionFilter({
      includeTags: [],
      excludeTags: parseExclusionTags(globalExclusionTags),
    });
    refreshData();
    setShowPracticeOverlay(true);
    setIsCramming(false);
  };

  const onClosePracticeOverlayCallback = () => {
    setShowPracticeOverlay(false);
    setIsCramming(false);
    refreshData();
  };

  const handleMemoTagChange = (tag) => {
    setSelectedTag(tag);
  };

  const handleReviewMoreClick = async () => {
    // @TODOZ: Handle this case.
    refreshData();
  };

  useCollapseReferenceList({ dataPageTitle });

  // Keep counters in sync as you add/remove tags from blocks
  const [tagsOnEnter, setTagsOnEnter] = React.useState([]);
  const onBlockEnterHandler = (elm: HTMLTextAreaElement) => {
    const tags = tagsList.filter((tag) => elm.value.includes(tag));
    setTagsOnEnter(tags);
  };
  const onBlockLeaveHandler = (elm: HTMLTextAreaElement) => {
    // Don't refetch data if overlay is open (to avoid removing cards while editing)
    if (showPracticeOverlay) return;

    const tags = tagsList.filter((tag) => elm.value.includes(tag));

    if (tagsOnEnter.length !== tags.length) {
      fetchPracticeData();
    }
  };

  useOnBlockInteract({
    onEnterCallback: onBlockEnterHandler,
    onLeaveCallback: onBlockLeaveHandler,
  });

  useCommandPaletteAction({ onShowPracticeOverlay });

  return (
    <Blueprint.HotkeysProvider>
      <>
        <SidePannelWidget onClickCallback={onShowPracticeOverlay} today={today} />
        {showPracticeOverlay && (
          <PracticeOverlay
            setRenderMode={setRenderMode}
            isOpen={true}
            practiceData={practiceData}
            handlePracticeClick={handlePracticeClick}
            handleArchiveClick={handleArchiveClick}
            onCloseCallback={onClosePracticeOverlayCallback}
            handleMemoTagChange={handleMemoTagChange}
            handleReviewMoreClick={handleReviewMoreClick}
            tagsList={tagsList}
            selectedTag={selectedTag}
            isCramming={isCramming}
            setIsCramming={setIsCramming}
            rtlEnabled={rtlEnabled}
            today={today}
            sessionFilter={sessionFilter}
            onSessionFilterChange={setSessionFilter}
          />
        )}
      </>
    </Blueprint.HotkeysProvider>
  );
};

export default App;
