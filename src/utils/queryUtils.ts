import type { UseQueryResult } from '@tanstack/react-query';

export function createMockQueryResult<T>(data: T): UseQueryResult<T, Error> {
  const result: any = {
    data,
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: true,
    status: 'success',
    isPaused: false,
    isEnabled: true,
    refetch: async () => result,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    fetchStatus: 'idle',
    failureReason: null,
    errorUpdateCount: 0,
    isLoadingError: false,
    isPending: false,
  };

  // Add promise property
  result.promise = Promise.resolve(result);
  
  return result as UseQueryResult<T, Error>;
}
