import React, { useEffect, useState } from 'react';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import type { FieldValidation } from '@rjsf/utils';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { AzureDevOpsReleasePipeline } from './types';


export const AzureReleasePiplineSelector = ({
    onChange,
    rawErrors,
    required,
    formData,
}: FieldExtensionComponentProps<string>) => {
    const [pipelines, setPipelines] = useState<AzureDevOpsReleasePipeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchPipelines = async () => {
            try {
                const response = await fetch(
                    'http://localhost:7007/api/azure-dev-ops/release-pipelines/luishenrique92250483/backstage'
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setPipelines(data.value);
            } catch (err: any) {
                setError(err.message || 'Failed to load pipelines');
            } finally {
                setLoading(false);
            }
        };

        fetchPipelines();
    }, []);

    if (loading) {
        return (
            <FormControl margin="normal" fullWidth>
                <CircularProgress size={24} />
                <FormHelperText>Loading pipelines...</FormHelperText>
            </FormControl>
        );
    }

    if (error) {
        return (
            <FormControl margin="normal" error fullWidth>
                <FormHelperText>{error}</FormHelperText>
            </FormControl>
        );
    }

    return (
        <FormControl
            margin="normal"
            required={required}
            error={rawErrors?.length > 0 && !formData}
            fullWidth
        >
            <InputLabel id="azure-pipeline-label">Release Pipeline</InputLabel>
            <Select
                labelId="azure-pipeline-label"
                value={formData || ''}
                onChange={e => onChange(e.target.value as string)}
                label="Release Pipeline"
            >
                {pipelines.map(pipeline => (
                    <MenuItem key={pipeline.id} value={pipeline.id.toString()}>
                        {pipeline.name}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>
                {rawErrors?.length > 0 && !formData
                    ? 'You must select a pipeline'
                    : 'Select an Azure DevOps Release Pipeline'}
            </FormHelperText>
        </FormControl>
    );
};

export const AzureReleasePiplineSelectorValidation = (
    value: string,
    validation: FieldValidation,
) => {
    if (!value) {
        validation.addError('You must select a pipeline');
    }
};
