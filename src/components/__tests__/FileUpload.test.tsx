import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../FileUpload';

describe('FileUpload', () => {
  const onFileSelect = vi.fn();
  
  beforeEach(() => {
    onFileSelect.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the upload area with default text', () => {
    render(<FileUpload onFileSelect={onFileSelect} />);
    
    expect(screen.getByText('Upload a file')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, GIF up to 2MB')).toBeInTheDocument();
  });

  it('allows selecting a file', async () => {
    const user = userEvent.setup();
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    render(<FileUpload onFileSelect={onFileSelect} />);
    
    const input = screen.getByTestId('file-upload-input') as HTMLInputElement;
    await user.upload(input, file);
    
    expect(onFileSelect).toHaveBeenCalledWith(file);
    expect(input.files?.[0]).toStrictEqual(file);
    expect(input.files).toHaveLength(1);
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    render(
      <FileUpload 
        onFileSelect={onFileSelect} 
        accept="image/*"
      />
    );
    
    const input = screen.getByTestId('file-upload-input');
    await user.upload(input, file);
    
    // Should not call onFileSelect for invalid file type
    expect(onFileSelect).not.toHaveBeenCalled();
    
    // Check if the file input is actually empty
    expect((input as HTMLInputElement).files).toHaveLength(0);
  });

  it('shows preview when currentUrl is provided', () => {
    const testUrl = 'https://example.com/logo.png';
    
    render(
      <FileUpload 
        onFileSelect={onFileSelect} 
        currentUrl={testUrl}
        label="Team Logo"
      />
    );
    
    const img = screen.getByRole('img', { name: /preview/i });
    expect(img).toHaveAttribute('src', testUrl);
    expect(screen.getByText('Team Logo')).toBeInTheDocument();
  });

  it('allows removing the selected file', async () => {
    const user = userEvent.setup();
    const testUrl = 'https://example.com/logo.png';
    
    render(
      <FileUpload 
        onFileSelect={onFileSelect} 
        currentUrl={testUrl}
      />
    );
    
    // Click the remove button (it's an icon button with no text, so we'll find it by role and position)
    const buttons = screen.getAllByRole('button');
    const removeButton = buttons[buttons.length - 1]; // The remove button is the last button
    await user.click(removeButton);
    
    // Should call onFileSelect with null to remove the file
    expect(onFileSelect).toHaveBeenCalledWith(null);
    
    // The preview should be removed
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles drag and drop', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    
    render(<FileUpload onFileSelect={onFileSelect} />);
    
    const dropZone = screen.getByText('or drag and drop').closest('div')!;
    
    // The drop zone is the parent div with the border-dashed class
    const dropZoneParent = dropZone.closest('.border-dashed')!;
    fireEvent.dragOver(dropZoneParent);
    
    // The border color and background color are applied via classes
    // We'll check for the presence of these classes
    expect(dropZoneParent).toHaveClass('border-blue-500');
    expect(dropZoneParent).toHaveClass('bg-blue-50');
    
    // Create a data transfer object
    const dataTransfer = {
      files: [file],
      items: [{
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      }],
      clearData: vi.fn(),
      setData: vi.fn(),
    };
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer
    });
    
    // Should call onFileSelect with the dropped file
    expect(onFileSelect).toHaveBeenCalledWith(file);
    
    // Should remove drag styles after drop
    fireEvent.dragLeave(dropZoneParent);
    // After drag leave, the classes should be removed
    expect(dropZoneParent).not.toHaveClass('border-blue-500');
    expect(dropZoneParent).not.toHaveClass('bg-blue-50');
  });
});
