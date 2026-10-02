import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { MultipleFilesUpload, type MultipleFilesUploadProps, type FilesMetaData } from '../multiple-files-upload';

export interface RHFMultipleFileUploadProps<TFieldValues extends FieldValues>
  extends Omit<MultipleFilesUploadProps, 'onUpload'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFMultipleFileUpload<TFieldValues extends FieldValues>(
  props: RHFMultipleFileUploadProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <MultipleFilesUpload
          {...rest}
          onUpload={(files: FilesMetaData[]) => field.onChange(files)}
        />
      )}
    />
  );
}
