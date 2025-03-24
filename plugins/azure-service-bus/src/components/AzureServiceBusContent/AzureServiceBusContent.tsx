import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Grid,
  Link,
  Snackbar,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@material-ui/core';
import {
  InfoCard,
  Page,
  Content,
  WarningPanel,
  Progress
} from '@backstage/core-components';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { PipelineParams } from '../../types';
import { useAzurePipelineRunner } from '../../hooks/useAzurePipelineRunner';
import { ResourceTable } from './components/ResourceTable';
import ReprocessModal from './components/ReprocessModal';
import ReprocessForm from './components/ReprocessForm';
import BuildLogs from './components/BuildLogs';
import { Alert } from '@material-ui/lab';
import HistoryIcon from '@material-ui/icons/History';
import ClearAllIcon from '@material-ui/icons/ClearAll';

export const AzureServiceBusContent = () => {
  const { entity } = useEntity();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{
    resourceName: string;
    resourceType: string
  } | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const {
    loading,
    activeBuildId,
    build,
    buildLogsDetails,
    buildsHistory,
    triggerPipeline,
    trackBuild,
    clearBuild,
    clearHistory,
    error,
    setError
  } = useAzurePipelineRunner();

  const config = useApi(configApiRef);
  const pipelineUrl = config.getOptionalString('plugins.azureServiceBus.pipelineUrl');

  if (!pipelineUrl) {
    return (
      <WarningPanel severity="error" title="Missing Configuration">
        The Azure Service Bus pipeline URL is not configured in app-config.yaml
      </WarningPanel>
    );
  }

  const serviceName = entity.metadata.name;
  const queueNames = entity.metadata.annotations?.['azure-service-bus/queues'];
  const topicsNames = entity.metadata.annotations?.['azure-service-bus/topics'];

  if (!queueNames && !topicsNames) {
    return (<MissingAnnotationEmptyState annotation={[
      'azure-service-bus/queues',
      'azure-service-bus/topics'
    ]} />);
  }

  const combinedData = [
    ...(queueNames ? queueNames.split(',').map(name => ({
      resourceName: name.trim(),
      resourceType: 'queue' as const,
    })) : []),
    ...(topicsNames ? topicsNames.split(',').map(name => ({
      resourceName: name.trim(),
      resourceType: 'topic' as const,
    })) : []),
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
      setAlertMessage('Pipeline triggered successfully!');
    } catch (err) {
      setAlertMessage(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setAlertOpen(true);
      setModalOpen(false);
    }
  };

  const renderActionButton = (row: { resourceName: string; resourceType: string }) => {
    const resourceBuilds = buildsHistory
      .filter(b => b.resourceName === row.resourceName)
      .sort((a, b) => b.timestamp - a.timestamp);

    const latestBuild = resourceBuilds[0];
    const isActive = latestBuild?.buildId === activeBuildId;
    const isRunning = latestBuild?.status === 'inProgress';

    return (
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <Button
            variant="contained"
            color={isRunning ? 'secondary' : 'primary'}
            onClick={() => latestBuild ? trackBuild(latestBuild.buildId) : handleOpenModal(row)}
            disabled={loading}
            startIcon={isRunning && <CircularProgress size={14} />}
          >
            {latestBuild ? (
              isRunning ? 'Acompanhar' : 'Executar Novamente'
            ) : 'Executar'}
          </Button>
        </Grid>

        {resourceBuilds.length > 0 && (
          <Grid item>
            <Tooltip title="Ver histórico de builds">
              <Chip
                size="small"
                icon={<HistoryIcon fontSize="small" />}
                label={resourceBuilds.length}
                onClick={() => trackBuild(latestBuild.buildId)}
                variant="outlined"
              />
            </Tooltip>
          </Grid>
        )}
      </Grid>
    );
  };

  return (
    <Page themeId="tool">
      <Content>
        <Grid container spacing={3}>
          {/* Coluna da Tabela */}
          <Grid item xs={12} md={(activeBuildId || build) ? 6 : 12}>
            <Grid container spacing={3} direction="column">
              <Grid item>
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Typography variant="h4">Azure Service Bus Pipelines</Typography>
                  </Grid>
                  <Grid item>
                    <Tooltip title="Limpar histórico">
                      <IconButton
                        onClick={clearHistory}
                        disabled={buildsHistory.length === 0}
                      >
                        <ClearAllIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item>
                <ResourceTable
                  combinedData={combinedData}
                  renderActionButton={renderActionButton}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Coluna dos Logs */}
          {(activeBuildId || build) && (
            <Grid item xs={12} md={6}>
              <InfoCard
                title={
                  <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                      {build ? (
                        <Link href={build._links.web.href} target="_blank" rel="noreferrer">
                          Build #{build.buildNumber} ({build.status})
                        </Link>
                      ) : (
                        <Typography>Loading build #{activeBuildId}...</Typography>
                      )}
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={clearBuild}
                        disabled={loading}
                        size="small"
                      >
                        Fechar
                      </Button>
                    </Grid>
                  </Grid>
                }
              >
                {loading && !buildLogsDetails.length ? (
                  <Progress />
                ) : (
                  <div style={{ height: '500px', overflow: 'auto' }}>
                    <BuildLogs buildLogsDetails={buildLogsDetails} />
                  </div>
                )}
              </InfoCard>
            </Grid>
          )}
        </Grid>
      </Content>

      {selectedResource && (
        <ReprocessModal
          open={modalOpen}
          onClose={handleCloseModal}
          title={`Reprocessar ${selectedResource.resourceType === 'queue' ? 'Fila' : 'Tópico'}`}
        >
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
          severity={alertMessage.startsWith('Error') ? 'error' : 'success'}
          onClose={() => setAlertOpen(false)}
        >
          {alertMessage}
        </Alert>
      </Snackbar>

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      )}
    </Page>
  );
};
