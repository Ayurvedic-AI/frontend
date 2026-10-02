import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomFileUpload, type CustomFileUploadProps, type FileItem } from '../custom-fileupload';

export interface RHFFileUploadProps<TFieldValues extends FieldValues>
  extends Omit<
    CustomFileUploadProps,
    'files' | 'onFilesChange' | 'hasError' | 'errorMessage' | 'multiple'
  > {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFFileUpload<TFieldValues extends FieldValues>(
  props: RHFFileUploadProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomFileUpload
          {...rest}
          multiple={false}
          files={(field.value as FileItem[] | undefined) ?? []}
          onFilesChange={(files) => field.onChange(files.slice(-1))}
          hasError={Boolean(fieldState.error)}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
