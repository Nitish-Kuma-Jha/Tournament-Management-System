exports.getPaginationOptions = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.paginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    pagination: {
      current: page,
      total: totalPages,
      count: data.length,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

exports.buildSortQuery = (sort) => {
  if (!sort) return { createdAt: -1 };
  const parts = sort.split(':');
  return { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
};
