import React from 'react';
import { FieldExtensionComponentProps } from '@backstage/plugin-scaffolder-react';
import type { FieldValidation } from '@rjsf/utils';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useAzureDevOpsRepositories } from './hooks/useAzureDevOpsRepositories';
import { AzureDevOpsRepositories } from './types';

export const AzureRepositorySelector = ({
    onChange,
    rawErrors,
    required,
    formData,
    uiSchema,
}: FieldExtensionComponentProps<{
    id: string;
    name: string;
}>) => {
    const organization = uiSchema['ui:options']!.organization as string;
    const project = uiSchema['ui:options']!.project as string;

    const { repositories, loading, error } = useAzureDevOpsRepositories(organization, project);

    if (loading) {
        return (
            <FormControl margin="normal" fullWidth>
                <CircularProgress size={24} />
                <FormHelperText>Loading repositories...</FormHelperText>
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
            <InputLabel id="azure-repository-label">Repositories</InputLabel>
            <Select
                labelId="azure-repository-label"
                value={formData?.id || ''}
                onChange={e => {
                    const selectedRepository = repositories.find(
                        repository => repository.id.toString() === e.target.value
                    );
                    if (selectedRepository) {
                        onChange({ id: selectedRepository.id, name: selectedRepository.name });
                    }
                }}
                displayEmpty
                MenuProps={{
                    PaperProps: {
                        style: {
                            maxHeight: 250, // Define um limite para a altura do menu
                            overflowY: 'auto',
                        },
                    },
                }}
            >
                {repositories.map((repository: AzureDevOpsRepositories) => (
                    <MenuItem key={repository.id} value={repository.id.toString()}>
                        {repository.name}
                    </MenuItem>
                ))}
            </Select>
            <FormHelperText>
                {rawErrors?.length > 0 && !formData
                    ? 'You must select a repository'
                    : 'Select an Azure DevOps repository'}
            </FormHelperText>
        </FormControl>
    );
};

export const AzureRepositorySelectorValidation = (
    value: { id: string; name: string },
    validation: FieldValidation,
) => {
    if (!value) {
        validation.addError('You must select a repository');
    }
};
