import { useState } from 'react';

interface PaginationState {
  page: number;
  pageSize: number;
}

export function usePagination(initialPageSize = 10) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
  });

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize });
  };

  const resetPage = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return {
    ...pagination,
    handlePageChange,
    resetPage,
    paginationConfig: {
      current: pagination.page,
      pageSize: pagination.pageSize,
      onChange: handlePageChange,
      showSizeChanger: true,
      showTotal: (total: number) => `Total ${total} items`,
    },
  };
}
