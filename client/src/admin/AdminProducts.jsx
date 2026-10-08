import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaEdit,
  FaPlus,
  FaSearch,
  FaStar,
  FaSyncAlt,
  FaToggleOff,
  FaToggleOn,
  FaTrash,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const AdminProducts = () => {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    featured,
    setFeatured,
  ] = useState("");

  const [
    stockFilter,
    setStockFilter,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 12,
    totalProducts: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [
    busyProductId,
    setBusyProductId,
  ] = useState("");

  /**
   * Backend-supported filters:
   *
   * page
   * limit
   * search
   * category
   * status
   * featured=true
   * stock=low
   * stock=out
   *
   * Sorting is intentionally not sent yet.
   * Backend currently always sorts newest first.
   */
  const loadProducts =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(page)
          );

          params.set(
            "limit",
            "12"
          );

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (category) {
            params.set(
              "category",
              category
            );
          }

          if (status) {
            params.set(
              "status",
              status
            );
          }

          if (
            featured ===
            "true"
          ) {
            params.set(
              "featured",
              "true"
            );
          }

          if (stockFilter) {
            params.set(
              "stock",
              stockFilter
            );
          }

          const response =
            await api.get(
              `/admin/products?${params.toString()}`
            );

          setProducts(
            Array.isArray(
              response.data
                ?.products
            )
              ? response.data
                  .products
              : []
          );

          setPagination(
            response.data
              ?.pagination || {
              page: 1,
              limit: 12,
              totalProducts: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            }
          );
        } catch (error) {
          setProducts([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load products."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        search,
        category,
        status,
        featured,
        stockFilter,
      ]
    );

  /**
   * Public categories endpoint.
   *
   * Used only to populate the admin
   * category dropdown.
   */
  const loadCategories =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "/products/categories"
            );

          setCategories(
            Array.isArray(
              response.data
                ?.categories
            )
              ? response.data
                  .categories
              : []
          );
        } catch (error) {
          console.error(
            "Unable to load product categories:",
            error
          );

          setCategories([]);
        }
      },
      []
    );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  /**
   * Debounced product loading.
   */
  useEffect(() => {
    const timeout =
      setTimeout(() => {
        loadProducts();
      }, 250);

    return () =>
      clearTimeout(
        timeout
      );
  }, [loadProducts]);

  /**
   * Reset pagination whenever
   * filters change.
   */
  useEffect(() => {
    setPage(1);
  }, [
    search,
    category,
    status,
    featured,
    stockFilter,
  ]);

  const currentResultCount =
    products.length;

  /**
   * These summary values are based only
   * on the currently loaded page.
   */
  const lowStockCount =
    useMemo(
      () =>
        products.filter(
          (product) => {
            const stock =
              Number(
                product.stock ||
                  0
              );

            const threshold =
              Number(
                product.lowStockThreshold ||
                  0
              );

            return (
              stock > 0 &&
              stock <= threshold
            );
          }
        ).length,
      [products]
    );

  const featuredCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.isFeatured
        ).length,
      [products]
    );

  const formatPrice =
    (value) => {
      return Number(
        value || 0
      ).toLocaleString(
        "en-IN",
        {
          maximumFractionDigits:
            2,
        }
      );
    };

  const formatDate =
    (value) => {
      if (!value) {
        return "-";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "-";
      }

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

  const clearFeedback =
    () => {
      setError("");
      setMessage("");
    };

  /**
   * Activate / deactivate product.
   *
   * Backend:
   * PATCH /admin/products/:productId/status
   *
   * Body:
   * {
   *   isActive: boolean
   * }
   */
  const handleToggleStatus =
    async (
      product
    ) => {
      if (!product?._id) {
        return;
      }

      clearFeedback();

      try {
        setBusyProductId(
          product._id
        );

        const response =
          await api.patch(
            `/admin/products/${product._id}/status`,
            {
              isActive:
                !product.isActive,
            }
          );

        setMessage(
          response.data
            ?.message ||
            `Product ${
              product.isActive
                ? "deactivated"
                : "activated"
            } successfully.`
        );

        await loadProducts();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update product status."
          )
        );
      } finally {
        setBusyProductId(
          ""
        );
      }
    };

  /**
   * Update stock.
   *
   * Backend:
   * PATCH /admin/products/:productId/stock
   *
   * Body supports:
   * {
   *   stock,
   *   lowStockThreshold
   * }
   *
   * Here we update stock only.
   * Threshold remains editable in product form.
   */
  const handleStockUpdate =
    async (
      product
    ) => {
      if (!product?._id) {
        return;
      }

      clearFeedback();

      const value =
        window.prompt(
          `Enter new stock quantity for "${product.name}"`,
          String(
            product.stock ?? 0
          )
        );

      if (
        value === null
      ) {
        return;
      }

      const trimmedValue =
        String(
          value
        ).trim();

      if (!trimmedValue) {
        setError(
          "Stock quantity is required."
        );

        return;
      }

      const stock =
        Number(
          trimmedValue
        );

      if (
        !Number.isInteger(
          stock
        ) ||
        stock < 0
      ) {
        setError(
          "Stock must be a whole number greater than or equal to 0."
        );

        return;
      }

      try {
        setBusyProductId(
          product._id
        );

        const response =
          await api.patch(
            `/admin/products/${product._id}/stock`,
            {
              stock,
            }
          );

        setMessage(
          response.data
            ?.message ||
            "Product stock updated successfully."
        );

        await loadProducts();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update product stock."
          )
        );
      } finally {
        setBusyProductId(
          ""
        );
      }
    };

  /**
   * Permanently delete product.
   *
   * Backend also removes:
   * - Cart references
   * - Wishlist references
   * - Cloudinary images
   *
   * Existing orders remain safe because
   * order items use snapshots.
   */
  const handleDelete =
    async (
      product
    ) => {
      if (!product?._id) {
        return;
      }

      clearFeedback();

      const confirmed =
        window.confirm(
          `Delete "${product.name}" permanently?\n\nThis will also remove the product from customer carts and wishlists. This action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        setBusyProductId(
          product._id
        );

        const response =
          await api.delete(
            `/admin/products/${product._id}`
          );

        setMessage(
          response.data
            ?.message ||
            "Product deleted successfully."
        );

        /**
         * If deleting the last product
         * on a page, return to previous
         * page instead of showing a
         * temporary empty page.
         */
        if (
          products.length ===
            1 &&
          page > 1
        ) {
          setPage(
            (current) =>
              Math.max(
                current - 1,
                1
              )
          );
        } else {
          await loadProducts();
        }

        await loadCategories();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to delete product."
          )
        );
      } finally {
        setBusyProductId(
          ""
        );
      }
    };

  const resetFilters =
    () => {
      setSearch("");
      setCategory("");
      setStatus("");
      setFeatured("");
      setStockFilter("");
      setPage(1);
    };

  if (
    loading &&
    products.length ===
      0
  ) {
    return (
      <main className="admin-page admin-products-page">
        <Loader
          fullPage
          text="Loading products..."
        />
      </main>
    );
  }

  return (
    <main className="admin-page admin-products-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            Product Management
          </span>

          <h1>
            Products
          </h1>

          <p>
            Manage NovaCart products,
            pricing, inventory,
            availability, and featured
            products.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <Link
            to="/admin/products/new"
            className="admin-primary-button"
          >
            <FaPlus />

            Add Product
          </Link>
        </div>
      </div>

      {message && (
        <div className="admin-message success">
          <span>
            {message}
          </span>
        </div>
      )}

      {error && (
        <div className="admin-message error">
          <div>
            <strong>
              Product operation failed
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              loadProducts();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <section className="admin-product-summary-grid">
        <article className="admin-mini-stat">
          <span>
            Total Matching Products
          </span>

          <strong>
            {pagination.totalProducts}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Current Page
          </span>

          <strong>
            {currentResultCount}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Low Stock on Page
          </span>

          <strong>
            {lowStockCount}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Featured on Page
          </span>

          <strong>
            {featuredCount}
          </strong>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-product-filters">
          <div className="admin-search-box">
            <FaSearch />

            <input
              type="search"
              placeholder="Search name, SKU, category, brand..."
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
            />
          </div>

          <select
            value={
              category
            }
            onChange={(
              event
            ) =>
              setCategory(
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Categories
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>

          <select
            value={
              status
            }
            onChange={(
              event
            ) =>
              setStatus(
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <select
            value={
              featured
            }
            onChange={(
              event
            ) =>
              setFeatured(
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Products
            </option>

            <option value="true">
              Featured Only
            </option>
          </select>

          <select
            value={
              stockFilter
            }
            onChange={(
              event
            ) =>
              setStockFilter(
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Stock
            </option>

            <option value="low">
              Low Stock
            </option>

            <option value="out">
              Out of Stock
            </option>
          </select>

          <button
            type="button"
            className="admin-filter-reset"
            onClick={
              resetFilters
            }
          >
            <FaSyncAlt />

            Reset
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-card-eyebrow">
              Inventory
            </span>

            <h2>
              Product List
            </h2>
          </div>

          <span className="admin-result-count">
            {pagination.totalProducts}{" "}
            matching
          </span>
        </div>

        {products.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table admin-products-table">
                <thead>
                  <tr>
                    <th>
                      Product
                    </th>

                    <th>
                      SKU
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Price
                    </th>

                    <th>
                      Stock
                    </th>

                    <th>
                      Featured
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Updated
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (
                      product
                    ) => {
                      const regularPrice =
                        Number(
                          product.price ||
                            0
                        );

                      const discountPrice =
                        product.discountPrice !==
                          null &&
                        product.discountPrice !==
                          undefined &&
                        product.discountPrice !==
                          ""
                          ? Number(
                              product.discountPrice
                            )
                          : null;

                      const finalPrice =
                        discountPrice !==
                          null &&
                        !Number.isNaN(
                          discountPrice
                        ) &&
                        discountPrice <
                          regularPrice
                          ? discountPrice
                          : regularPrice;

                      const stock =
                        Number(
                          product.stock ||
                            0
                        );

                      const threshold =
                        Number(
                          product.lowStockThreshold ||
                            0
                        );

                      const isLowStock =
                        stock > 0 &&
                        stock <=
                          threshold;

                      const isBusy =
                        busyProductId ===
                        product._id;

                      return (
                        <tr
                          key={
                            product._id
                          }
                        >
                          <td>
                            <div className="admin-product-cell">
                              <div className="admin-product-thumb">
                                {product.images
                                  ?.[0]
                                  ?.url ? (
                                  <img
                                    src={
                                      product.images[0]
                                        .url
                                    }
                                    alt={
                                      product.name ||
                                      "Product"
                                    }
                                  />
                                ) : (
                                  <span>
                                    N
                                  </span>
                                )}
                              </div>

                              <div>
                                <strong>
                                  {product.name ||
                                    "Product"}
                                </strong>

                                <span>
                                  {product.brand ||
                                    "No brand"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <code>
                              {product.sku ||
                                "-"}
                            </code>
                          </td>

                          <td>
                            {product.category ||
                              "-"}
                          </td>

                          <td>
                            <div className="admin-price-cell">
                              <strong>
                                ₹
                                {formatPrice(
                                  finalPrice
                                )}
                              </strong>

                              {finalPrice !==
                                regularPrice && (
                                <span>
                                  ₹
                                  {formatPrice(
                                    regularPrice
                                  )}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="admin-stock-cell">
                              <strong>
                                {stock}
                              </strong>

                              {stock ===
                              0 ? (
                                <span className="out">
                                  Out
                                </span>
                              ) : isLowStock ? (
                                <span className="low">
                                  Low
                                </span>
                              ) : (
                                <span className="good">
                                  Good
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            {product.isFeatured ? (
                              <span className="admin-status admin-status-confirmed">
                                <FaStar />
                                Featured
                              </span>
                            ) : (
                              <span className="admin-status">
                                Standard
                              </span>
                            )}
                          </td>

                          <td>
                            <span
                              className={`admin-status ${
                                product.isActive
                                  ? "admin-status-active"
                                  : "admin-status-inactive"
                              }`}
                            >
                              {product.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              product.updatedAt
                            )}
                          </td>

                          <td>
                            <div className="admin-table-actions">
                              <Link
                                to={`/admin/products/${product._id}/edit`}
                                title="Edit product"
                              >
                                <FaEdit />
                              </Link>

                              <button
                                type="button"
                                title="Update stock"
                                onClick={() =>
                                  handleStockUpdate(
                                    product
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                              >
                                <FaBoxOpen />
                              </button>

                              <button
                                type="button"
                                title={
                                  product.isActive
                                    ? "Deactivate product"
                                    : "Activate product"
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    product
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                              >
                                {product.isActive ? (
                                  <FaToggleOn />
                                ) : (
                                  <FaToggleOff />
                                )}
                              </button>

                              <button
                                type="button"
                                className="danger"
                                title="Delete product permanently"
                                onClick={() =>
                                  handleDelete(
                                    product
                                  )
                                }
                                disabled={
                                  isBusy
                                }
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          current - 1,
                          1
                        )
                    )
                  }
                >
                  Previous
                </button>

                <div>
                  {Array.from(
                    {
                      length:
                        pagination.totalPages,
                    },
                    (
                      _,
                      index
                    ) =>
                      index + 1
                  ).map(
                    (
                      pageNumber
                    ) => (
                      <button
                        type="button"
                        key={
                          pageNumber
                        }
                        className={
                          pageNumber ===
                          pagination.page
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setPage(
                            pageNumber
                          )
                        }
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.min(
                          current + 1,
                          pagination.totalPages
                        )
                    )
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="admin-empty-state">
            <FaBoxOpen />

            <h3>
              No products found
            </h3>

            <p>
              No products match the
              current search and filters.
            </p>

            <div className="admin-page-header-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={
                  resetFilters
                }
              >
                <FaSyncAlt />

                Reset Filters
              </button>

              <Link
                to="/admin/products/new"
                className="admin-primary-button"
              >
                <FaPlus />

                Add Product
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminProducts;