import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, SearchX, UserPlus } from 'lucide-react';
import { CommonTable } from '../../../common/common-table';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomSearch } from '../../../common/custom-search';
import { CustomSelect } from '../../../common/custom-select';
import { toast } from '../../../common/common-snackbar';
import {
  PRAKRITI_LABEL,
  STATUS_LABEL,
  getPatientsListQueryKey,
  usePatientsDelete,
  usePatientsList,
  type Patient,
} from '../api/patients-stubs';
import { PatientFormDrawer } from '../components/PatientFormDrawer';
import { patientColumns } from '../components/patient-columns';
import { filterPatients, type PatientFilters } from '../utils/filter-patients';

const STATUS_ITEMS = [{ value: 'all', label: 'All statuses' }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))];
const PRAKRITI_ITEMS = [{ value: 'all', label: 'All Prakriti' }, ...Object.entries(PRAKRITI_LABEL).map(([value, label]) => ({ value, label }))];
const NO_FILTERS: PatientFilters = { query: '', status: 'all', prakriti: 'all' };

export function PatientsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = usePatientsList();
  const patients = useMemo(() => data?.data ?? [], [data]);

  const [filters, setFilters] = useState<PatientFilters>(NO_FILTERS);
  // Bumped on "Clear filters" to remount the search box, which owns its own input state.
  const [searchKey, setSearchKey] = useState(0);
  const [drawer, setDrawer] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null });
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  const visible = useMemo(() => filterPatients(patients, filters), [patients, filters]);
  const filtered = filters.query !== '' || filters.status !== 'all' || filters.prakriti !== 'all';
  const withAllergies = patients.filter((p) => p.allergies.length > 0).length;

  const openAdd = () => setDrawer({ open: true, patient: null });
  const columns = useMemo(
    () =>
      patientColumns({
        onEdit: (patient) => setDrawer({ open: true, patient }),
        onViewSummary: (patient) => navigate(`/ai-summary?patient=${patient.id}`),
        onDelete: setToDelete,
      }),
    [navigate],
  );

  const deleteMutation = usePatientsDelete({
    mutation: {
      onSuccess: (_res, { patientId }) => {
        queryClient.invalidateQueries({ queryKey: getPatientsListQueryKey() });
        toast({ message: `${toDelete?.full_name ?? patientId} deleted`, severity: 'success' });
        setToDelete(null);
      },
      onError: () => toast({ message: 'Could not delete the patient. Try again.', severity: 'error' }),
    },
  });

  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setSearchKey((k) => k + 1);
  };

  const emptyState = filtered ? (
    <div className="flex flex-col items-center gap-3 py-6">
      <SearchX aria-hidden className="size-8 text-neutral-30" />
      <p className="text-sm text-foreground">No patients match these filters.</p>
      <CustomButton variant="outline" size="sm" onClick={clearFilters}>
        Clear filters
      </CustomButton>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 py-6">
      <UserPlus aria-hidden className="size-8 text-neutral-30" />
      <div>
        <p className="text-sm font-medium text-foreground">No patients yet</p>
        <p className="text-xs text-muted-foreground">Add your first patient to start their record.</p>
      </div>
      <CustomButton size="sm" icon={<Plus className="size-4" />} onClick={openAdd}>
        Add patient
      </CustomButton>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Loading your register…'
              : `${patients.length} registered · ${withAllergies} with known allergies`}
          </p>
        </div>
        <CustomButton icon={<Plus className="size-4" />} onClick={openAdd} className="self-start sm:self-auto">
          Add patient
        </CustomButton>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {filtered && !isLoading ? `Showing ${visible.length} of ${patients.length}` : ''}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* The search sets an inline width, so the responsive width lives on this wrapper. */}
          <div className="w-full sm:w-80">
            <CustomSearch
              key={searchKey}
              textData={{ placeholder: 'Search name, phone or Reg. No.', btnTitle: 'Search' }}
              onSearch={(query) => setFilters((f) => ({ ...f, query }))}
              hasStartSearchIcon
              width="100%"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <CustomSelect
              name="status"
              placeholder="Status"
              value={filters.status}
              items={STATUS_ITEMS}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as PatientFilters['status'] }))}
              bgWhite
              className="sm:w-40"
            />
            <CustomSelect
              name="prakriti"
              placeholder="Prakriti"
              value={filters.prakriti}
              items={PRAKRITI_ITEMS}
              onChange={(e) => setFilters((f) => ({ ...f, prakriti: e.target.value as PatientFilters['prakriti'] }))}
              bgWhite
              className="sm:w-40"
            />
          </div>
        </div>
      </div>

      <CommonTable
        columns={columns}
        data={visible}
        loading={isLoading}
        getRowId={(p) => p.id}
        onRowClick={(patient) => setDrawer({ open: true, patient })}
        emptyState={emptyState}
        enableSorting
        enablePagination
        pageSize={10}
        density="compact"
        tableClassName="min-w-[640px] md:min-w-[860px]"
      />

      <PatientFormDrawer
        open={drawer.open}
        patient={drawer.patient}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />

      <ConfirmationPopUp
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteMutation.mutate({ patientId: toDelete.id })}
        title="Delete patient"
        message={
          toDelete && (
            <>
              Delete <strong>{toDelete.full_name}</strong> ({toDelete.id}) from your register? This cannot be undone.
            </>
          )
        }
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        confirmDisabled={deleteMutation.isPending}
        destructive
      />
    </div>
  );
}
