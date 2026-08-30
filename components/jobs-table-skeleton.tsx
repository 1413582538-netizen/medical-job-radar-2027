import React from "react";

type JobsTableSkeletonProps = {
  columns: readonly string[];
};

export function JobsTableSkeleton({ columns }: JobsTableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th className="whitespace-nowrap px-4 py-3 font-medium" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              className="px-4 py-12 text-center text-slate-500"
              colSpan={columns.length}
            >
              暂无已收录岗位
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
