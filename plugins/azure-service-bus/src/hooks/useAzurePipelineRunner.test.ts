import { act, renderHook } from '@testing-library/react-hooks';
import { useAzurePipelineRunner } from './useAzurePipelineRunner';
import { useApi } from '@backstage/core-plugin-api';
import { PipelineParamsType } from '../types';

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

  describe('Initial State', () => {
    it('should return the correct initial state', () => {
      const { result } = renderHook(() => useAzurePipelineRunner());

      expect(result.current).toEqual({
        loading: false,
        error: null,
        buildLogsDetails: [],
        buildManagerState: {},
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

      expect(result.current.buildManagerState).toEqual(mockData);
    });

    it('should filter out expired items from localStorage', () => {
      const mockData = {
        resource1: {
          buildId: 1,
          status: 'queued',
          timestamp: Date.now() - 86400001,
        },
        resource2: { buildId: 2, status: 'running', timestamp: Date.now() },
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockData));

      const { result } = renderHook(() => useAzurePipelineRunner());

      expect(result.current.buildManagerState).toEqual({
        resource2: mockData.resource2,
      });
    });
  });

  describe('Pipeline Operations', () => {
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

      await act(async () => {
        await result.current.triggerPipeline(mockPipelineData);
      });

      expect(mockTriggerPipeline).toHaveBeenCalledWith(mockPipelineData);
      expect(result.current.buildManagerState).toEqual({
        [mockPipelineData.resource_name]: {
          resourceType: mockPipelineData.resource_type,
          buildId: mockBuildResponse.id,
          status: 'queued',
          timestamp: expect.any(Number),
        },
      });
      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify(result.current.buildManagerState),
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

      mockCancelBuild.mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.cancelBuild('resource1');
      });

      expect(mockCancelBuild).toHaveBeenCalledWith(123);
      expect(result.current.buildManagerState.resource1.status).toBe(
        'completed',
      );
    });
  });

  describe('State Updates', () => {
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

      await act(async () => {
        await result.current.startBuild('resource1');
      });

      const expectedState = {
        resource1: {
          ...mockBuildState.resource1,
          status: 'running',
        },
      };

      expect(result.current.buildManagerState).toEqual(expectedState);
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

      await act(async () => {
        await result.current.completeBuild('resource1');
      });

      const expectedState = {
        resource1: {
          ...mockBuildState.resource1,
          status: 'completed',
        },
      };

      expect(result.current.buildManagerState).toEqual(expectedState);
      expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBe(
        JSON.stringify(expectedState),
      );
    });
  });

  describe('Interval and Logs', () => {
    it('should stop the fetch interval when no builds are queued or running', async () => {
      const mockBuildState = {
        resource1: {
          buildId: 123,
          status: 'completed',
          timestamp: Date.now(),
          resourceType: 'topic',
        },
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

      const { result } = renderHook(() => useAzurePipelineRunner());

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockFetchBuildById).not.toHaveBeenCalled();
      expect(result.current.buildManagerState).toEqual(mockBuildState);
    });

    it('should fetch builds at 5-second intervals and update state correctly', async () => {
      const mockBuildResponse = {
        123: { id: 123, status: 'inProgress' },
      };

      const mockBuildState = {
        resource1: {
          buildId: 123,
          status: 'queued',
          timestamp: Date.now(),
          resourceType: 'topic',
        },
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

      mockFetchBuildById.mockImplementation(
        async (id: keyof typeof mockBuildResponse) => mockBuildResponse[id],
      );

      const { result, waitForNextUpdate } = renderHook(() =>
        useAzurePipelineRunner(),
      );

      await act(async () => {
        jest.advanceTimersByTime(5000);
        await waitForNextUpdate();
      });

      expect(result.current.buildManagerState.resource1.status).toBe('running');
    });
  });

  describe('Change Current Build View', () => {
    it('should change current build view and fetch logs', async () => {
      const mockBuildState = {
        resource1: {
          buildId: 456,
          status: 'running',
          timestamp: Date.now(),
          resourceType: 'topic',
        },
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockBuildState));

      mockFetchBuildLogs.mockResolvedValue({
        value: [{ id: 1 }, { id: 2 }],
      });

      mockFetchLogById.mockImplementation(id => ({
        id,
        content: `log content ${id}`,
      }));

      const { result } = renderHook(() => useAzurePipelineRunner());

      await act(async () => {
        result.current.changeCurrentBuildViewAndFetchLogs('resource1');
      });

      expect(result.current.currentBuildView).toBe('resource1');
      expect(result.current.buildLogsDetails.length).toBe(2);
    });
  });
});
