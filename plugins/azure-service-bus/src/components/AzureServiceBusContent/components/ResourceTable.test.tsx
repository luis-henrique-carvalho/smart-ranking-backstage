import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceTable } from './ResourceTable';

jest.spyOn(console, 'error').mockImplementation((message) => {
    return
});

describe('ResourceTable', () => {
    const mockData: { resourceName: string; resourceType: 'queue' | 'topic' }[] = [
        { resourceName: 'Queue1', resourceType: 'queue' },
        { resourceName: 'Topic1', resourceType: 'topic' },
    ];

    const mockRenderActionButton = jest.fn((row) => (
        <button>
            Action for {row.resourceName}
        </button>
    ));

    it('should render the table with correct data', () => {
        render(
            <ResourceTable
                combinedData={mockData}
                renderActionButton={mockRenderActionButton}
            />
        );

        expect(screen.getByText('Queue1')).toBeInTheDocument();
        expect(screen.getByText('Topic1')).toBeInTheDocument();
        expect(screen.getByText('queue')).toBeInTheDocument();
        expect(screen.getByText('topic')).toBeInTheDocument();
    });

    it('should handle action button clicks', () => {
        const handleClick = jest.fn();

        const customRenderActionButton = (row: {
            resourceName: string;
            resourceType: string;
        }) => (
            <button
                data-testid={`action-button-${row.resourceName}`}
                onClick={() => handleClick(row.resourceName)}
            >
                Action for {row.resourceName}
            </button>
        );

        render(
            <ResourceTable
                combinedData={mockData}
                renderActionButton={customRenderActionButton}
            />
        );

        fireEvent.click(screen.getByTestId('action-button-Queue1'));
        expect(handleClick).toHaveBeenCalledWith('Queue1');

        fireEvent.click(screen.getByTestId('action-button-Topic1'));
        expect(handleClick).toHaveBeenCalledWith('Topic1');
    });
});
