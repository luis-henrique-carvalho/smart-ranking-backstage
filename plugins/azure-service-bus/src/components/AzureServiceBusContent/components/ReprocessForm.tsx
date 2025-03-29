import React, { useState } from 'react';
import {
    TextField, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel, Button
} from '@material-ui/core';
import { PipelineParamsType } from '../../../types';

type ReprocessFormProps = {
    serviceName: string;
    resourceType: string;
    resourceName: string;
    onSubmit: (data: PipelineParamsType) => void;
    isLoading: boolean;
};

const ReprocessForm: React.FC<ReprocessFormProps> = ({ serviceName, resourceType, resourceName, onSubmit, isLoading }) => {
    const [generateNewMessageId, setGenerateNewMessageId] = useState(false);
    const [reprocessingMethod, setReprocessingMethod] = useState<'safe' | 'fast'>('safe');

    const handleSubmit = () => {
        onSubmit({
            service_name: serviceName,
            resource_type: resourceType as 'topic' | 'queue',
            resource_name: resourceName,
            generate_new_message_id: generateNewMessageId,
            reprocessing_method: reprocessingMethod,
        });
    };

    return (
        <>
            <TextField label="Nome do Serviço" value={serviceName} fullWidth disabled margin="normal" />
            <TextField label="Tipo do Recurso" value={resourceType} fullWidth disabled margin="normal" />
            <TextField label="Nome do Recurso" value={resourceName} fullWidth disabled margin="normal" />

            <FormControlLabel
                control={<Checkbox checked={generateNewMessageId} onChange={(e) => setGenerateNewMessageId(e.target.checked)} />}
                label="Gerar Novo ID de Mensagem"
            />

            <FormControl fullWidth margin="normal">
                <InputLabel>Método de Reprocessamento</InputLabel>
                <Select value={reprocessingMethod} onChange={(e) => setReprocessingMethod(e.target.value as 'safe' | 'fast')}>
                    <MenuItem value="safe">Seguro</MenuItem>
                    <MenuItem value="fast">Rápido</MenuItem>
                </Select>
            </FormControl>

            <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth style={{ marginBottom: 8, marginTop: 8 }} disabled={isLoading}>
                Submeter
            </Button >
        </>
    );
};

export default ReprocessForm;
