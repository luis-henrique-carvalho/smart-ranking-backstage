import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@material-ui/core';
import { Branch } from '../../../types';

interface BranchSelectProps {
    branches: Branch[];
    selectedBranch: string;
    onBranchChange: (branch: string) => void;
}

export const BranchSelect = ({ branches, selectedBranch, onBranchChange }: BranchSelectProps) => (
    <Box mb={2}>
        <FormControl variant="outlined" size="medium" style={{ width: '200px' }}>
            <InputLabel>Selecionar Branch</InputLabel>
            <Select
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value as string)}
                label="Selecionar Branch"
            >
                {branches.map((branch) => (
                    <MenuItem key={branch.objectId} value={branch.name}>
                        {branch.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    </Box>
);
