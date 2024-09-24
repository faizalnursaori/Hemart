'use client';
import { useSession } from 'next-auth/react';
import { StoreTable } from '@/components/Store/StoreTable';
import Link from 'next/link';

export default function StoreManagement() {
  const { data } = useSession();
  return (
    <>
      <div className="flex flex-col">
        {data?.user?.role === 'SUPER_ADMIN' ? (
          <>
            <div className="flex flex-row justify-between">
              <h2 className="text-xl my-4">Store Management</h2>
            </div>
            <div className="bg-white">
              <StoreTable/>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center items-center flex-col p-3">
              <h2 className="text-3xl text-center my-2">
                You Don't have an access to this page.
              </h2>
              <div className="mt-4 flex w-80 items-center justify-center gap-8">
                <Link
                  className="relative flex items-center justify-center text-xl no-underline outline-none transition-opacity hover:opacity-80 active:opacity-60"
                  href="/"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="m12 19-7-7 7-7"></path>
                    <path d="M19 12H5"></path>
                  </svg>
                  <span className="flex items-center">Back to Homepage</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}