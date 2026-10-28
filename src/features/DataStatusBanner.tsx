/** Offline and sync-failure status shown at the top of data screens (Figma C9). */
import { useAppData } from '@/src/state/AppDataProvider';
import { Alert, OfflineBanner } from '@/src/ui';

export function DataStatusBanner() {
  const { offline, pendingWrites, writeError, clearWriteError } = useAppData();
  return (
    <>
      {writeError ? (
        <Alert tone="error" title="A change could not be saved" detail={`${writeError.message} The change has been undone.`} actionTitle="OK" onAction={clearWriteError} testID="write-error-banner" />
      ) : null}
      {offline ? <OfflineBanner pendingWrites={pendingWrites} /> : null}
    </>
  );
}
