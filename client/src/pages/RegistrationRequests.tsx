import { RegistrationRequestsTable } from "@/features/RegistrationRequests/components/RegistrationRequestsTable";

const RegistrationRequests = () => {
  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Registration Requests</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review and manage pending employee account registrations.</p>
      </div>
      <RegistrationRequestsTable />
    </div>
  );
};

export default RegistrationRequests;
