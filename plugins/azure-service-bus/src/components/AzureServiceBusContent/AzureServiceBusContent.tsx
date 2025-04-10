import React, { useState } from 'react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { useAzurePipelineRunner } from '../../hooks/useAzurePipelineRunner';
import { PipelineParamsType } from '../../types';
import { Grid, Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { InfoCard } from '@backstage/core-components';
import BuildLogs from './components/BuildLogs';
import InfoCardTitle from './components/InfoCardTitle';
import ReprocessForm from './components/ReprocessForm';
import ReprocessModal from './components/ReprocessModal';
import { ResourceActionButton } from './components/ResourceActionButton';
import { ResourceTable } from './components/ResourceTable';

export const AzureServiceBusContent = () => {
  const { entity } = useEntity();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ resourceName: string; resourceType: string } | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const {
    loading,
    triggerPipeline,
    buildLogsDetails,
    currentBuildView,
    changeCurrentBuildViewAndFetchLogs,
    buildManagerState,
    cancelBuild,
  } = useAzurePipelineRunner();

  const config = useApi(configApiRef);
  const pipilineUrl = config.getOptionalString('plugins.azureServiceBus.pipelineUrl');

  if (!pipilineUrl) {
    throw new Error('Configuração "plugins.azureServiceBus.pipelineUrl" ausente no app-config.yaml');
  }

  const serviceName = entity.metadata.name;
  const queueNames = entity.metadata.annotations?.['azure-service-bus/queues'];
  const topicsNames = entity.metadata.annotations?.['azure-service-bus/topics'];

  if (!queueNames && !topicsNames) {
    return <MissingAnnotationEmptyState annotation={['azure-service-bus/queues', 'azure-service-bus/topics']} />;
  }

  const combinedData: { resourceName: string, resourceType: "queue" | "topic" }[] = [
    ...(queueNames ? queueNames.split(',').map(resourceName => ({ resourceName, resourceType: 'queue' as const })) : []),
    ...(topicsNames ? topicsNames.split(',').map(resourceName => ({ resourceName, resourceType: 'topic' as const })) : []),
  ];

  const handleOpenModal = (resource: { resourceName: string; resourceType: string }) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedResource(null);
    setModalOpen(false);
  };

  const handleSubmit = async (data: PipelineParamsType) => {
    try {
      await triggerPipeline(data);
      setAlertMessage('Pipeline disparado com sucesso!');
    } catch (err) {
      setAlertMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setAlertOpen(true);
      setModalOpen(false);
    }
  };

  const handleCancelBuild = async (resourceName: string) => {
    try {
      await cancelBuild(resourceName);
      setAlertMessage('Build cancelado com sucesso!');
    }
    catch (err) {
      setAlertMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
    finally {
      setAlertOpen(true);
    }
  };

  const renderActionButton = (row: { resourceName: string; resourceType: string }) => (
    <ResourceActionButton
      resource={row}
      buildManagerState={buildManagerState}
      loading={loading}
      onOpenModal={handleOpenModal}
      onChangeCurrentBuildView={changeCurrentBuildViewAndFetchLogs}
      onCancelBuild={handleCancelBuild}
    />
  );

  const buildView = currentBuildView ? buildManagerState[currentBuildView] : undefined;

  return (
    <Grid container>
      <Grid container spacing={3}>
        <Grid item xs={7}>
          <ResourceTable
            buildManagerState={buildManagerState}
            combinedData={combinedData}
            renderActionButton={renderActionButton}
          />
        </Grid>
        <Grid item xs={5}>
          <InfoCard
            title={
              buildView ? (
                <InfoCardTitle buildView={buildView} />
              ) : 'Logs do Build'
            }
          >
            {buildLogsDetails && <BuildLogs buildLogsDetails={buildLogsDetails} isLoading={loading} />}
          </InfoCard>
        </Grid>
      </Grid>

      {
        selectedResource && (
          <ReprocessModal open={modalOpen} onClose={handleCloseModal} title="Reprocessar Dead Letter">
            <ReprocessForm
              onSubmit={handleSubmit}
              serviceName={serviceName}
              resourceType={selectedResource.resourceType}
              resourceName={selectedResource.resourceName}
              isLoading={loading}
            />
          </ReprocessModal>
        )
      }

      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={alertMessage.startsWith('Erro') ? 'error' : 'success'}
          onClose={() => setAlertOpen(false)}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Grid >
  );
};
