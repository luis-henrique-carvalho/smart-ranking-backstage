import React from 'react';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import type { FieldValidation } from '@rjsf/utils';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useAzureDevOpsProject } from './hooks/useAzureDevOpsProject';
import { AzureDevOpsProjects } from './types';

export const AzureProjectSelector = ({
    onChange,
    rawErrors,
    required,
    formData,
}: FieldExtensionComponentProps<string>) => {
    const organization = 'luishenrique92250483';

    const { projects, loading, error } = useAzureDevOpsProject(organization);

    if (loading) {
        return (
            <FormControl margin="normal" fullWidth>
                <CircularProgress size={24} />
                <FormHelperText>Loading projects...</FormHelperText>
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
            <InputLabel id="azure-project-label">Projects</InputLabel>
            <Select
                labelId="azure-project-label"
                value={formData || ''}
                onChange={e => onChange(e.target.value as string)}
                label="Projects"
            >
                {projects.map((project: AzureDevOpsProjects) => (
                    <MenuItem key={project.id} value={project.id.toString()}>
                        {project.name}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>
                {rawErrors?.length > 0 && !formData
                    ? 'You must select a project'
                    : 'Select an Azure DevOps Project'}
            </FormHelperText>
        </FormControl>
    );
};

export const AzureProjectSelectorValidation = (
    value: string,
    validation: FieldValidation,
) => {
    if (!value) {
        validation.addError('You must select a project');
    }
};
