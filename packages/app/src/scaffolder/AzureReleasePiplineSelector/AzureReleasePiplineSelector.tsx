import React from 'react';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import type { FieldValidation } from '@rjsf/utils';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useAzureDevOpsPipelines } from './hooks/useAzureDevOpsPipelines';
import { AzureDevOpsReleasePipeline } from './types';

export const AzureReleasePiplineSelector = ({
    onChange,
    rawErrors,
    required,
    formData,
    uiSchema
}: FieldExtensionComponentProps<string>) => {
    const org = uiSchema['ui:options']!.organization as string;
    const project = uiSchema['ui:options']!.project as string;

    const { pipelines, loading, error } = useAzureDevOpsPipelines(org, project);

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
                {pipelines.map((pipeline: AzureDevOpsReleasePipeline) => (
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
