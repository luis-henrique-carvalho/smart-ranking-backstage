import React, { useState } from 'react';
import {
  Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Snackbar, CircularProgress
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { InfoCard, Header, Page, Content } from '@backstage/core-components';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import ReprocessModal from './components/ReprocessModal';
import ReprocessForm from './components/ReprocessForm';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { AzureServiceBusApiRef } from '../../api';
import { PipelineParams } from '../../types';

export const AzureServiceBusContent = () => {
  const { entity } = useEntity();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ resourceName: string; resourceType: string } | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const azureServiceBusApi = useApi(AzureServiceBusApiRef);
  const config = useApi(configApiRef);

  const pipilineUrl = config.getOptionalString('plugins.azureServiceBus.piplineUrl');

  if (!pipilineUrl) {
    throw new Error('Configuração "plugins.azureServiceBus.piplineUrl" ausente no app-config.yaml');
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

  const handleSubmit = async (data: PipelineParams) => {
    setLoading(true);
    try {
      await azureServiceBusApi.triggerPipeline(data);
      setAlertMessage('Pipeline disparado com sucesso!');
    } catch (error) {
      setAlertMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setAlertOpen(true);
      setModalOpen(false);
    }
  };

  return (
    <Page themeId="tool">
      <Header title="Azure Service Bus" subtitle="Plugin para visualização de filas e tópicos do Azure Service Bus" />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12}>
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
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOpenModal(row)}
                            disabled={loading}
                          >
                            {loading ? <CircularProgress size={24} /> : 'Reifileirar Dead Letter'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>

      {selectedResource && (
        <ReprocessModal open={modalOpen} onClose={() => setModalOpen(false)} title="Reifileirar Dead Letter">
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
