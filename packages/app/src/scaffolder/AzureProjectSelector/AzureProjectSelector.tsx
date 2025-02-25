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
    uiSchema
}: FieldExtensionComponentProps<{
    id: string;
    name: string;
}>) => {
    const organization = uiSchema['ui:options']!.organization as string;

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
                value={formData ? formData.name : ''}
                onChange={e => {
                    const selectedProject = projects.find(
                        project => project.id.toString() === e.target.value
                    );
                    if (selectedProject) {
                        onChange({ id: selectedProject.id, name: selectedProject.name });
                    }
                }}
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
    value: { id: string; name: string },
    validation: FieldValidation,
) => {
    if (!value) {
        validation.addError('You must select a project');
    }
};
