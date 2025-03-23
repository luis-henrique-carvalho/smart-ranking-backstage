import React, { useState } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Snackbar, CircularProgress,
  Link
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { InfoCard, Header, Page, Content } from '@backstage/core-components';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import ReprocessModal from './components/ReprocessModal';
import ReprocessForm from './components/ReprocessForm';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { PipelineParams } from '../../types';
import { useAzurePipelineRunner } from '../../hooks/useAzurePipelineRunner';
import BuildLogs from './components/BuildLogs';

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
    buildInProgress,
    build,
    resetState
  } = useAzurePipelineRunner();

  const config = useApi(configApiRef);

  const pipilineUrl = config.getOptionalString('plugins.azureServiceBus.pipelineUrl');

  if (!pipilineUrl) {
    throw new Error('Configuração "plugins.azureServiceBus.pipelineUrl" ausente no app-config.yaml');
  }

  const serviceName = entity.metadata.name;
  const queueNames = entity.metadata.annotations?.['azure-service-bus/queues'];
  const topicsNames = entity.metadata.annotations?.['azure-service-bus/topics'];

  if (!queueNames || !topicsNames) {
    return <MissingAnnotationEmptyState annotation={['azure-service-bus/queues', 'azure-service-bus/topics']} />;
  }

  const combinedData: { resourceName: string, resourceType: "queue" | "topic" }[] = [
    ...queueNames.split(',').map(resourceName => ({ resourceName, resourceType: 'queue' as const })),
    ...topicsNames.split(',').map(resourceName => ({ resourceName, resourceType: 'topic' as const }))
  ];

  const handleOpenModal = (resource: { resourceName: string; resourceType: string }) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedResource(null);
    setModalOpen(false);
  }

  const handleSubmit = async (data: PipelineParams) => {
    try {
      await triggerPipeline(data);
      setAlertMessage('Pipeline disparado com sucesso!');
    } catch (err) {
      setAlertMessage(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setAlertOpen(true);
      setModalOpen(false);
      setTimeout(() => setAlertOpen(false), 5000);
    }
  };

  const renderActionButton = (row: { resourceName: string, resourceType: string }) => {
    if (buildInProgress) {
      return selectedResource?.resourceName === row.resourceName ? (
        <Typography color="secondary">{build?.status}</Typography>
      ) : (
        <CircularProgress size={24} />
      );
    }

    return (
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenModal(row)}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Run Pipeline'}
      </Button>
    );
  };

  return (
    <Page themeId="tool" >
      <Header title="Azure Service Bus" subtitle="Plugin para visualização de filas e tópicos do Azure Service Bus" />
      <Content>
        <Grid container spacing={3} >
          <Grid item xs={6}>
            <InfoCard title="Filas e Tópicos">
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="h6">Nome</Typography></TableCell>
                      <TableCell><Typography variant="h6">Tipo</Typography></TableCell>
                      <TableCell><Typography variant="h6">Ação</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {combinedData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.resourceName}</TableCell>
                        <TableCell>{row.resourceType}</TableCell>
                        <TableCell>
                          <TableCell>{renderActionButton(row)}</TableCell>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </InfoCard>
          </Grid>
          <Grid item xs={6}>
            <InfoCard title={
              build ? (
                <Grid container justifyContent="space-between" alignItems="center">
                  <Grid item>
                    <Link href={build._links.web.href} target="_blank" rel="noreferrer">
                      Logs do Build #{build.buildNumber}
                    </Link>
                  </Grid>
                  <Grid item>
                    {build.status === 'completed' ? (
                      <Button variant="contained" color="primary" onClick={resetState}>
                        Limpar
                      </Button>
                    ) : null}
                  </Grid>
                </Grid>
              ) : 'Logs do Build'
            }>
              {buildLogsDetails && (
                <BuildLogs
                  loading={loading}
                  buildLogsDetails={buildLogsDetails}
                />
              )}
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

      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={() => setAlertOpen(false)}>
        <Alert severity={alertMessage.startsWith('Erro') ? 'error' : 'success'}>{alertMessage}</Alert>
      </Snackbar>
    </Page>
  );
};
