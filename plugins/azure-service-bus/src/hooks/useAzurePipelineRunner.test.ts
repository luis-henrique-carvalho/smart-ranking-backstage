import { act, renderHook } from '@testing-library/react-hooks';
import { useAzurePipelineRunner } from './useAzurePipelineRunner';
import { useApi } from '@backstage/core-plugin-api';
import {
  BuildLogDetailsType,
  BuildLogsResponse,
  PipelineParamsType,
} from '../types';

jest.mock('../api', () => ({
  AzureServiceBusApiRef: {
    id: 'plugin.azure-service-bus.service',
  },
}));

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: jest.fn(),
}));

const LOCAL_STORAGE_KEY = 'azurePipelineQueueManager';

describe('useAzurePipelineRunner', () => {
  const mockFetchLogById = jest.fn();
  const mockFetchBuildLogs = jest.fn();
  const mockTriggerPipeline = jest.fn();
  const mockCancelBuild = jest.fn();
  const mockFetchBuildById = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    localStorage.clear();

    (useApi as jest.Mock).mockReturnValue({
      fetchBuildLogs: mockFetchBuildLogs,
      fetchLogById: mockFetchLogById,
      triggerPipeline: mockTriggerPipeline,
      cancelBuild: mockCancelBuild,
      fetchBuildById: mockFetchBuildById,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.resetAllMocks();
  });

  it('should return the correct initial state', () => {
    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current).toEqual({
      loading: false,
      error: null,
      buildLogsDetails: [],
      buildMenagerState: {},
      currentBuildView: null,
      triggerPipeline: expect.any(Function),
      changeCurrentBuildViewAndFetchLogs: expect.any(Function),
      cancelBuild: expect.any(Function),
      completeBuild: expect.any(Function),
      startBuild: expect.any(Function),
    });
  });

  it('should fetch data from localStorage on load', () => {
    const mockData = {
      resource1: { buildId: 1, status: 'queued', timestamp: Date.now() },
      resource2: { buildId: 2, status: 'running', timestamp: Date.now() },
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockData));

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual(mockData);
  });

  it('should filter out expired items from localStorage', () => {
    const mockData = {
      resource1: {
        buildId: 1,
        status: 'queued',
        timestamp: Date.now() - 86400001,
      },
      resource2: { buildId: 2, status: 'running', timestamp: Date.now() }, // Válido
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockData));

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual({
      resource2: mockData.resource2,
    });
  });

  it('should trigger pipeline and update state correctly', async () => {
    const mockPipelineData: PipelineParamsType = {
      service_name: 'service',
      resource_type: 'topic',
      resource_name: 'resource',
      reprocessing_method: 'safe',
      generate_new_message_id: false,
    };

    const mockBuildResponse = {
      id: 123,
      status: 'notStarted',
      _links: { web: { href: 'http://build' } },
    };

    mockTriggerPipeline.mockResolvedValue(mockBuildResponse);

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.triggerPipeline(mockPipelineData);
    });

    expect(mockTriggerPipeline).toHaveBeenCalledWith(mockPipelineData);

    expect(result.current.buildMenagerState).toEqual({
      [mockPipelineData.resource_name]: {
        resourceType: mockPipelineData.resource_type,
        buildId: mockBuildResponse.id,
        status: 'queued',
        timestamp: expect.any(Number),
      },
    });

    expect(result.current.currentBuildView).toBe(
      mockPipelineData.resource_name,
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify(result.current.buildMenagerState),
    );
  });

  it('should handle errors when triggering a pipeline', async () => {
    const mockPipelineData: PipelineParamsType = {
      service_name: 'service',
      resource_type: 'topic',
      resource_name: 'resource',
      reprocessing_method: 'safe',
      generate_new_message_id: false,
    };

    const mockError = new Error('Erro ao disparar pipeline');

    mockTriggerPipeline.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAzurePipelineRunner());

    await act(async () => {
      await result.current.triggerPipeline(mockPipelineData);
    });

    expect(mockTriggerPipeline).toHaveBeenCalledWith(mockPipelineData);
    expect(result.current.error).toBe(mockError.message);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch builds at 5-second intervals and update state correctly', async () => {
    const mockBuildResponse = {
      123: { id: 123, status: 'inProgress' },
      124: { id: 124, status: 'completed' },
    };

    const mockBuildState = {
      resource1: {
        buildId: 123,
        status: 'queued',
        timestamp: Date.now(),
        resourceType: 'topic',
      },
      resource2: {
        buildId: 124,
        status: 'running',
        timestamp: Date.now(),
        resourceType: 'queue',
      },
    };

    localStorage.setItem(
      'azurePipelineQueueManager',
      JSON.stringify(mockBuildState),
    );

    mockFetchBuildById.mockImplementation(
      async (id: keyof typeof mockBuildResponse) => mockBuildResponse[id],
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useAzurePipelineRunner(),
    );

    expect(result.current.buildMenagerState).toEqual(mockBuildState);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(result.current.buildMenagerState.resource1.status).toBe('running');
    expect(result.current.buildMenagerState.resource2.status).toBe('completed');

    mockBuildResponse[123].status = 'completed';

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await waitForNextUpdate();
    });

    expect(result.current.buildMenagerState.resource1.status).toBe('completed');
    expect(result.current.buildMenagerState.resource2.status).toBe('completed');

    expect(mockFetchBuildById).toHaveBeenNthCalledWith(1, 123);
    expect(mockFetchBuildById).toHaveBeenNthCalledWith(2, 124);
    expect(mockFetchBuildById).toHaveBeenNthCalledWith(3, 123);
  });

  it('should fetch builds at 5-second and set logs when currentBuildView is set', async () => {
    const mockBuildResponse = {
      123: { id: 123, status: 'inProgress' },
      124: { id: 124, status: 'completed' },
    };

    const mockFetchBuildLogsResponse: Record<number, BuildLogsResponse> = {
      123: {
        count: 2,
        value: [
          {
            id: 10,
            url: 'http://log1',
            lineCount: 0,
            createdOn: '',
            lastChangedOn: '',
            type: '',
          },
          {
            id: 20,
            url: 'http://log2',
            lineCount: 0,
            createdOn: '',
            lastChangedOn: '',
            type: '',
          },
        ],
      },
      124: { count: 0, value: [] },
    };

    const mockFetchLogByIdResponse: Record<number, BuildLogDetailsType> = {
      10: { id: 10, value: ['log1', 'log2'] },
      20: { id: 20, value: ['log2'] },
    };

    const mockBuildState = {
      resource1: {
        buildId: 123,
        status: 'queued',
        timestamp: Date.now(),
        resourceType: 'topic',
      },
      resource2: {
        buildId: 124,
        status: 'running',
        timestamp: Date.now(),
        resourceType: 'queue',
      },
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

    mockFetchBuildById.mockImplementation(
      async (id: keyof typeof mockBuildResponse) => mockBuildResponse[id],
    );
    mockFetchBuildLogs.mockImplementation(
      async (id: keyof typeof mockBuildResponse) =>
        mockFetchBuildLogsResponse[id],
    );
    mockFetchLogById.mockImplementation(
      async (id: number) => mockFetchLogByIdResponse[id],
    );

    const { result, waitFor } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual(mockBuildState);

    await act(async () => {
      await result.current.changeCurrentBuildViewAndFetchLogs('resource1');
    });

    await waitFor(() => {
      expect(result.current.currentBuildView).toBe('resource1');
      expect(result.current.buildLogsDetails).toEqual([
        { id: 10, value: ['log1', 'log2'] },
        { id: 20, value: ['log2'] },
      ]);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.buildMenagerState.resource1.status).toBe('running');
      expect(result.current.buildMenagerState.resource2.status).toBe(
        'completed',
      );
    });

    expect(mockFetchBuildById).toHaveBeenCalledWith(123);
    expect(mockFetchBuildLogs).toHaveBeenCalledWith(123);
    expect(mockFetchLogById).toHaveBeenCalledWith(10, 123);
    expect(mockFetchLogById).toHaveBeenCalledWith(20, 123);
  });

  it('should cancel a build and update state correctly', async () => {
    const mockBuildState = {
      resource1: {
        buildId: 123,
        status: 'running',
        timestamp: Date.now(),
        resourceType: 'topic',
      },
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual(mockBuildState);

    mockCancelBuild.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.cancelBuild('resource1');
    });

    expect(mockCancelBuild).toHaveBeenCalledWith(123);
    expect(result.current.buildMenagerState.resource1.status).toBe('completed');
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should stop the fetch interval when no builds are queued or running', async () => {
    const mockBuildState = {
      resource1: {
        buildId: 123,
        status: 'completed',
        timestamp: Date.now(),
        resourceType: 'topic',
      },
      resource2: {
        buildId: 124,
        status: 'completed',
        timestamp: Date.now(),
        resourceType: 'queue',
      },
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual(mockBuildState);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetchBuildById).not.toHaveBeenCalled();
  });

  it('should persist updated state in localStorage after each operation', async () => {
    const mockPipelineData: PipelineParamsType = {
      service_name: 'service',
      resource_type: 'topic',
      resource_name: 'resource',
      reprocessing_method: 'safe',
      generate_new_message_id: false,
    };

    const mockBuildResponse = {
      id: 123,
      status: 'notStarted',
      _links: { web: { href: 'http://build' } },
    };

    mockTriggerPipeline.mockResolvedValue(mockBuildResponse);

    const { result } = renderHook(() => useAzurePipelineRunner());

    await act(async () => {
      await result.current.triggerPipeline(mockPipelineData);
    });

    const expectedStateAfterTrigger = {
      [mockPipelineData.resource_name]: {
        resourceType: mockPipelineData.resource_type,
        buildId: mockBuildResponse.id,
        status: 'queued',
        timestamp: expect.any(Number),
      },
    };

    const actualStateAfterTrigger = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
    );

    expect(actualStateAfterTrigger).toEqual(expectedStateAfterTrigger);

    mockCancelBuild.mockResolvedValueOnce(mockBuildResponse);

    await act(async () => {
      await result.current.cancelBuild(mockPipelineData.resource_name);
    });

    const expectedStateAfterCancel = {
      [mockPipelineData.resource_name]: {
        ...expectedStateAfterTrigger[mockPipelineData.resource_name],
        status: 'completed',
      },
    };

    const actualStateAfterCancel = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY) || '{}',
    );

    expect(result.current.buildMenagerState).toEqual(expectedStateAfterCancel);
    expect(actualStateAfterCancel).toEqual(expectedStateAfterCancel);
  });

  it('should update state and localStorage when startBuild is called', async () => {
    const mockBuildState = {
      resource1: {
        buildId: 123,
        status: 'queued',
        timestamp: Date.now(),
        resourceType: 'topic',
      },
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual(mockBuildState);

    await act(async () => {
      await result.current.startBuild('resource1');
    });

    const expectedState = {
      resource1: {
        ...mockBuildState.resource1,
        status: 'running',
      },
    };

    expect(result.current.buildMenagerState).toEqual(expectedState);
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify(expectedState),
    );
  });

  it('should update state and localStorage when completeBuild is called', async () => {
    const mockBuildState = {
      resource1: {
        buildId: 123,
        status: 'running',
        timestamp: Date.now(),
        resourceType: 'topic',
      },
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

    const { result } = renderHook(() => useAzurePipelineRunner());

    expect(result.current.buildMenagerState).toEqual(mockBuildState);

    await act(async () => {
      await result.current.completeBuild('resource1');
    });

    const expectedState = {
      resource1: {
        ...mockBuildState.resource1,
        status: 'completed',
      },
    };

    expect(result.current.buildMenagerState).toEqual(expectedState);
    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify(expectedState),
    );
  });
});
