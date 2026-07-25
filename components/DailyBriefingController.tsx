import React from 'react';
import DailyBriefingModal from '@/components/DailyBriefingModal';
import { useDailyBriefing } from '@/hooks/useDailyBriefing';

export default function DailyBriefingController() {
  const briefing = useDailyBriefing();

  return (
    <DailyBriefingModal
      visible={briefing.visible}
      firstName={briefing.firstName}
      content={briefing.content}
      onOpenMyDay={briefing.openMyDay}
      onDismiss={briefing.dismiss}
    />
  );
}
