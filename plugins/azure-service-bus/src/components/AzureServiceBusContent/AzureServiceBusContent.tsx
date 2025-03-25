import React, { useState } from 'react';
import { Button, CircularProgress, Grid, Snackbar, Typography } from '@material-ui/core';
import { InfoCard, Page, Content } from '@backstage/core-components';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { PipelineParams } from '../../types';
import { ResourceTable } from './components/ResourceTable';
import ReprocessModal from './components/ReprocessModal';
import ReprocessForm from './components/ReprocessForm';
import BuildLogs from './components/BuildLogs';
import { Alert } from '@material-ui/lab';
import { useAzurePipelineRunner } from '../../hooks/useAzurePipelineRunner';

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
    buildMenagerState,
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

  const handleSubmit = async (data: PipelineParams) => {
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

  const renderActionButton = (row: { resourceName: string, resourceType: string }) => {
    const currentResource = buildMenagerState[row.resourceName];
    // verifica a posição do recurso na fila
    // verifica quantos estão com status difernete de completed
    const totalInQueue = Object.values(buildMenagerState).filter(q => q.status !== 'completed').length;

    if (currentResource) {
      return (
        <Grid container spacing={1} alignItems="center">
          {currentResource.status === 'running' && (
            <Grid item>
              <CircularProgress size={20} />
            </Grid>
          )}
          <Grid item>
            {currentResource.status === 'completed' ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    changeCurrentBuildViewAndFetchLogs(row.resourceName);
                  }}
                >
                  Ver Logs
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleOpenModal(row)}
                  style={{ marginLeft: '8px' }}
                >
                  Executar
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color={currentResource.status === 'running' ? 'secondary' : 'primary'}
                onClick={() => {
                  changeCurrentBuildViewAndFetchLogs(row.resourceName);
                }}
              >
                {currentResource.status === 'running' && 'Em execução'}
                {currentResource.status === 'queued' && 'Aguardando'}
              </Button>
            )}
            {currentResource.status !== 'completed' &&
              <Typography variant="caption" display="block">
                Quantidade em fila: {totalInQueue}
              </Typography>
            }
            {currentResource.status === 'running' && (
              <Typography variant="caption" display="block" color="textSecondary">
                Em execução
              </Typography>
            )}
          </Grid>
        </Grid>
      );
    }

    return (
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenModal(row)}
        disabled={loading}
      >
        Executar
      </Button>
    );
  };

  const buildView = currentBuildView ? buildMenagerState[currentBuildView] : undefined;

  return (
    <Page themeId="tool">
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <ResourceTable
              combinedData={combinedData}
              renderActionButton={renderActionButton}
            />
          </Grid>
          <Grid item xs={6}>
            <InfoCard
              title={
                buildView ? (
                  <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                      <Typography>
                        Logs do Build #{buildView.buildId} = {currentBuildView}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography>
                        Status: {buildView.status}
                      </Typography>
                    </Grid>
                  </Grid>
                ) : 'Logs do Build'
              }
            >
              {buildLogsDetails && <BuildLogs buildLogsDetails={buildLogsDetails} />}
            </InfoCard>
          </Grid>
        </Grid>
      </Content>

      {selectedResource && (
        <ReprocessModal open={modalOpen} onClose={handleCloseModal} title="Reprocessar Dead Letter">
          <ReprocessForm
            onSubmit={handleSubmit}
            serviceName={serviceName}
            resourceType={selectedResource.resourceType}
            resourceName={selectedResource.resourceName}
          />
        </ReprocessModal>
      )}

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
    </Page>
  );
};
