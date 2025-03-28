import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configApiRef } from '@backstage/core-plugin-api';
import { ApiProvider } from '@backstage/core-app-api';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { AzureServiceBusContent } from './AzureServiceBusContent';
import { useAzurePipelineRunner } from '../../hooks/useAzurePipelineRunner';
import { TestApiRegistry } from '@backstage/test-utils';

jest.spyOn(console, 'error').mockImplementation((message) => {
    return
});

jest.mock('../../hooks/useAzurePipelineRunner', () => ({
    useAzurePipelineRunner: jest.fn(),
}));

const mockConfigApi = {
    getOptionalString: jest.fn(() => 'http://mock-pipeline-url'),
};

const apis = TestApiRegistry.from([configApiRef, mockConfigApi]);

describe('AzureServiceBusContent', () => {
    const mockTriggerPipeline = jest.fn();
    const mockCancelBuild = jest.fn();
    const mockChangeCurrentBuildViewAndFetchLogs = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAzurePipelineRunner as jest.Mock).mockReturnValue({
            loading: false,
            triggerPipeline: mockTriggerPipeline,
            buildLogsDetails: [],
            currentBuildView: null,
            changeCurrentBuildViewAndFetchLogs: mockChangeCurrentBuildViewAndFetchLogs,
            buildManagerState: {},
            cancelBuild: mockCancelBuild,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    const renderComponent = (annotations: Record<string, string> = {}) => {
        render(
            <ApiProvider apis={apis}>
                <EntityProvider
                    entity={{
                        apiVersion: 'backstage.io/v1alpha1',
                        kind: 'Component',
                        metadata: {
                            name: 'test-service',
                            annotations,
                        },
                    }}
                >
                    <AzureServiceBusContent />
                </EntityProvider>
            </ApiProvider>,
        );
    };
    it('should render both queues and topics when both annotations are provided', () => {
        renderComponent({
            'azure-service-bus/queues': 'queue1,queue2',
            'azure-service-bus/topics': 'topic1,topic2',
        });

        expect(screen.getByText('queue1')).toBeInTheDocument();
        expect(screen.getByText('queue2')).toBeInTheDocument();
        expect(screen.getByText('topic1')).toBeInTheDocument();
        expect(screen.getByText('topic2')).toBeInTheDocument();
    });

    it('should render the correct message when no annotations are provided', () => {
        renderComponent();

        expect(screen.getByText(/Missing Annotation/i)).toBeInTheDocument();
    });

    it('should render the resource table and logs section when annotations are provided', () => {
        renderComponent({
            'azure-service-bus/queues': 'queue1,queue2',
            'azure-service-bus/topics': 'topic1',
        });

        expect(screen.getByText('Logs do Build')).toBeInTheDocument();
        expect(screen.getByText('queue1')).toBeInTheDocument();
        expect(screen.getByText('queue2')).toBeInTheDocument();
        expect(screen.getByText('topic1')).toBeInTheDocument();
    });

    it('should render the resource table and logs section when only queues are provided', () => {
        renderComponent({
            'azure-service-bus/queues': 'queue1,queue2',
        });

        expect(screen.getByText('Logs do Build')).toBeInTheDocument();
        expect(screen.getByText('queue1')).toBeInTheDocument();
        expect(screen.getByText('queue2')).toBeInTheDocument();
    });

    it('should correctly handle annotations for queues and topics', () => {
        const annotations = {
            'azure-service-bus/queues': 'queue1,queue2',
            'azure-service-bus/topics': 'topic1,topic2',
        };

        renderComponent(annotations);

        expect(screen.getByText('queue1')).toBeInTheDocument();
        expect(screen.getByText('queue2')).toBeInTheDocument();
        expect(screen.getByText('topic1')).toBeInTheDocument();
        expect(screen.getByText('topic2')).toBeInTheDocument();
    });

    it('should display the buildView correctly in InfoCardTitle', () => {
        (useAzurePipelineRunner as jest.Mock).mockReturnValue({
            loading: false,
            triggerPipeline: jest.fn(),
            buildLogsDetails: [],
            currentBuildView: 'queue1',
            changeCurrentBuildViewAndFetchLogs: jest.fn(),
            buildManagerState: { // Corrigido para buildManagerState
                queue1: {
                    buildId: 123,
                    status: 'running',
                },
            },
            cancelBuild: jest.fn(),
        });

        renderComponent({
            'azure-service-bus/queues': 'queue1',
        });

        expect(screen.getByText('Build Logs: #123')).toBeInTheDocument();
        expect(screen.getByText('Status: running')).toBeInTheDocument();
    });

    it('should open the modal when the action button is clicked', async () => {
        renderComponent({
            'azure-service-bus/queues': 'queue1',
        });

        fireEvent.click(screen.getByText('Execute'));

        await waitFor(() => {
            expect(screen.getByText('Reprocessar Dead Letter')).toBeInTheDocument();
        })
    })

    it("should trigger the pipeline when the modal is submitted", async () => {
        renderComponent({
            'azure-service-bus/queues': 'queue1',
        });

        fireEvent.click(screen.getByText('Execute'));

        fireEvent.click(screen.getByText('Submeter'));

        await waitFor(() => {
            expect(mockTriggerPipeline).toHaveBeenCalled();
        });

        expect(screen.getByText('Pipeline disparado com sucesso!')).toBeInTheDocument();
    })

    it("should cancel the build when the action button is clicked", async () => {

        (useAzurePipelineRunner as jest.Mock).mockReturnValue({
            loading: false,
            triggerPipeline: jest.fn(),
            buildLogsDetails: [],
            currentBuildView: 'queue1',
            changeCurrentBuildViewAndFetchLogs: jest.fn(),
            buildManagerState: {
                queue1: {
                    buildId: 123,
                    status: 'running',
                },
            },
            cancelBuild: mockCancelBuild,
        });

        renderComponent({
            'azure-service-bus/queues': 'queue1',
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(mockCancelBuild).toHaveBeenCalled();
        });

        expect(screen.getByText('Build cancelado com sucesso!')).toBeInTheDocument();
    });

    it("should display an error message when handleSubmit fails", async () => {
        mockTriggerPipeline.mockRejectedValue(new Error("Pipeline error"));

        renderComponent({
            'azure-service-bus/queues': 'queue1',
        });

        fireEvent.click(screen.getByText('Execute'));

        fireEvent.click(screen.getByText('Submeter'));

        await waitFor(() => {
            expect(mockTriggerPipeline).toHaveBeenCalled();
        });

        expect(screen.getByText('Erro: Pipeline error')).toBeInTheDocument();
    });

    it("should display an error message when handleCancelBuild fails", async () => {
        mockCancelBuild.mockRejectedValue(new Error("Cancel error"));

        (useAzurePipelineRunner as jest.Mock).mockReturnValue({
            loading: false,
            triggerPipeline: jest.fn(),
            buildLogsDetails: [],
            currentBuildView: 'queue1',
            changeCurrentBuildViewAndFetchLogs: jest.fn(),
            buildManagerState: {
                queue1: {
                    buildId: 123,
                    status: 'running',
                },
            },
            cancelBuild: mockCancelBuild,
        });

        renderComponent({
            'azure-service-bus/queues': 'queue1',
        });

        fireEvent.click(screen.getByText('Cancel'));

        await waitFor(() => {
            expect(mockCancelBuild).toHaveBeenCalled();
        });

        expect(screen.getByText('Erro: Cancel error')).toBeInTheDocument();
    });
});
