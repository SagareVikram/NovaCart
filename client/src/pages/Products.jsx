import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaFilter,
  FaSearch,
  FaSlidersH,
  FaTimes,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";

const Products = () => {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const queryParams =
    useMemo(
      () =>
        new URLSearchParams(
          location.search
        ),
      [location.search]
    );

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    brands,
    setBrands,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    filtersLoading,
    setFiltersLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mobileFiltersOpen,
    setMobileFiltersOpen,
  ] = useState(false);

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

  const search =
    queryParams.get("search") ||
    "";

  const category =
    queryParams.get(
      "category"
    ) || "";

  const brand =
    queryParams.get("brand") ||
    "";

  const minPrice =
    queryParams.get(
      "minPrice"
    ) || "";

  const maxPrice =
    queryParams.get(
      "maxPrice"
    ) || "";

  const inStock =
    queryParams.get(
      "inStock"
    ) === "true";

  const featured =
    queryParams.get(
      "featured"
    ) === "true";

  const sort =
    queryParams.get("sort") ||
    "newest";

  const page =
    Number(
      queryParams.get("page")
    ) || 1;

  const [
    localSearch,
    setLocalSearch,
  ] = useState(search);

  const [
    localMinPrice,
    setLocalMinPrice,
  ] = useState(minPrice);

  const [
    localMaxPrice,
    setLocalMaxPrice,
  ] = useState(maxPrice);

  useEffect(() => {
    setLocalSearch(
      search
    );
  }, [search]);

  useEffect(() => {
    setLocalMinPrice(
      minPrice
    );

    setLocalMaxPrice(
      maxPrice
    );
  }, [
    minPrice,
    maxPrice,
  ]);

  const updateQuery =
    useCallback(
      (
        updates,
        {
          resetPage = true,
        } = {}
      ) => {
        const params =
          new URLSearchParams(
            location.search
          );

        Object.entries(
          updates
        ).forEach(
          ([
            key,
            value,
          ]) => {
            if (
              value === "" ||
              value === null ||
              value ===
                undefined ||
              value === false
            ) {
              params.delete(
                key
              );
            } else {
              params.set(
                key,
                String(value)
              );
            }
          }
        );

        if (resetPage) {
          params.delete(
            "page"
          );
        }

        const queryString =
          params.toString();

        navigate(
          queryString
            ? `/products?${queryString}`
            : "/products"
        );
      },
      [
        location.search,
        navigate,
      ]
    );

  const loadFilters =
    useCallback(
      async () => {
        try {
          setFiltersLoading(
            true
          );

          const [
            categoriesResponse,
            brandsResponse,
          ] =
            await Promise.all([
              api.get(
                "/products/categories"
              ),

              api.get(
                category
                  ? `/products/brands?category=${encodeURIComponent(
                      category
                    )}`
                  : "/products/brands"
              ),
            ]);

          setCategories(
            categoriesResponse
              .data
              ?.categories || []
          );

          setBrands(
            brandsResponse
              .data
              ?.brands || []
          );
        } catch (error) {
          console.error(
            "Unable to load filters:",
            error
          );

          setCategories(
            []
          );

          setBrands(
            []
          );
        } finally {
          setFiltersLoading(
            false
          );
        }
      },
      [category]
    );

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

          params.set(
            "sort",
            sort
          );

          if (search) {
            params.set(
              "search",
              search
            );
          }

          if (category) {
            params.set(
              "category",
              category
            );
          }

          if (brand) {
            params.set(
              "brand",
              brand
            );
          }

          if (minPrice) {
            params.set(
              "minPrice",
              minPrice
            );
          }

          if (maxPrice) {
            params.set(
              "maxPrice",
              maxPrice
            );
          }

          if (inStock) {
            params.set(
              "inStock",
              "true"
            );
          }

          if (featured) {
            params.set(
              "featured",
              "true"
            );
          }

          const response =
            await api.get(
              `/products?${params.toString()}`
            );

          setProducts(
            response.data
              ?.products || []
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
          setError(
            getApiErrorMessage(
              error,
              "Unable to load products."
            )
          );

          setProducts(
            []
          );
        } finally {
          setLoading(false);
        }
      },
      [
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        inStock,
        featured,
        sort,
        page,
      ]
    );

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setMobileFiltersOpen(
      false
    );
  }, [location.search]);

  useEffect(() => {
    if (
      mobileFiltersOpen
    ) {
      document.body.classList.add(
        "mobile-filters-active"
      );
    } else {
      document.body.classList.remove(
        "mobile-filters-active"
      );
    }

    return () => {
      document.body.classList.remove(
        "mobile-filters-active"
      );
    };
  }, [mobileFiltersOpen]);

  const handleSearchSubmit =
    (event) => {
      event.preventDefault();

      updateQuery({
        search:
          localSearch.trim(),
      });
    };

  const handlePriceSubmit =
    (event) => {
      event.preventDefault();

      const parsedMin =
        localMinPrice === ""
          ? ""
          : Math.max(
              Number(
                localMinPrice
              ) || 0,
              0
            );

      const parsedMax =
        localMaxPrice === ""
          ? ""
          : Math.max(
              Number(
                localMaxPrice
              ) || 0,
              0
            );

      updateQuery({
        minPrice:
          parsedMin,
        maxPrice:
          parsedMax,
      });
    };

  const clearFilters =
    () => {
      setLocalSearch("");
      setLocalMinPrice("");
      setLocalMaxPrice("");

      navigate(
        "/products"
      );
    };

  const hasActiveFilters =
    Boolean(
      search ||
        category ||
        brand ||
        minPrice ||
        maxPrice ||
        inStock ||
        featured
    );

  const filterContent = (
    <>
      <div className="products-filter-header">
        <div>
          <FaSlidersH />

          <h3>
            Filters
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={
              clearFilters
            }
            className="products-clear-filters"
          >
            Clear All
          </button>
        )}
      </div>

      <form
        className="products-filter-section products-search-filter"
        onSubmit={
          handleSearchSubmit
        }
      >
        <h4>
          Search
        </h4>

        <div className="products-filter-search-box">
          <input
            type="search"
            placeholder="Search products..."
            value={
              localSearch
            }
            onChange={(
              event
            ) =>
              setLocalSearch(
                event.target
                  .value
              )
            }
          />

          <button
            type="submit"
            aria-label="Search products"
          >
            <FaSearch />
          </button>
        </div>
      </form>

      <div className="products-filter-section">
        <h4>
          Categories
        </h4>

        {filtersLoading ? (
          <p className="products-filter-status">
            Loading...
          </p>
        ) : categories.length >
          0 ? (
          <div className="products-filter-options">
            <button
              type="button"
              className={
                !category
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateQuery({
                  category: "",
                  brand: "",
                })
              }
            >
              All Categories
            </button>

            {categories.map(
              (
                item
              ) => (
                <button
                  type="button"
                  key={
                    item
                  }
                  className={
                    category ===
                    item
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateQuery({
                      category:
                        item,
                      brand: "",
                    })
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>
        ) : (
          <p className="products-filter-status">
            No categories yet.
          </p>
        )}
      </div>

      <div className="products-filter-section">
        <h4>
          Brands
        </h4>

        {filtersLoading ? (
          <p className="products-filter-status">
            Loading...
          </p>
        ) : brands.length >
          0 ? (
          <div className="products-filter-options">
            <button
              type="button"
              className={
                !brand
                  ? "active"
                  : ""
              }
              onClick={() =>
                updateQuery({
                  brand: "",
                })
              }
            >
              All Brands
            </button>

            {brands.map(
              (
                item
              ) => (
                <button
                  type="button"
                  key={
                    item
                  }
                  className={
                    brand ===
                    item
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    updateQuery({
                      brand:
                        item,
                    })
                  }
                >
                  {item}
                </button>
              )
            )}
          </div>
        ) : (
          <p className="products-filter-status">
            No brands available.
          </p>
        )}
      </div>

      <form
        className="products-filter-section"
        onSubmit={
          handlePriceSubmit
        }
      >
        <h4>
          Price Range
        </h4>

        <div className="products-price-inputs">
          <div>
            <label htmlFor="min-price">
              Min
            </label>

            <input
              id="min-price"
              type="number"
              min="0"
              placeholder="₹0"
              value={
                localMinPrice
              }
              onChange={(
                event
              ) =>
                setLocalMinPrice(
                  event.target
                    .value
                )
              }
            />
          </div>

          <span>
            —
          </span>

          <div>
            <label htmlFor="max-price">
              Max
            </label>

            <input
              id="max-price"
              type="number"
              min="0"
              placeholder="₹50000"
              value={
                localMaxPrice
              }
              onChange={(
                event
              ) =>
                setLocalMaxPrice(
                  event.target
                    .value
                )
              }
            />
          </div>
        </div>

        <button
          type="submit"
          className="products-apply-price"
        >
          Apply Price
        </button>
      </form>

      <div className="products-filter-section">
        <h4>
          Availability
        </h4>

        <label className="products-checkbox-row">
          <input
            type="checkbox"
            checked={
              inStock
            }
            onChange={(
              event
            ) =>
              updateQuery({
                inStock:
                  event.target
                    .checked
                    ? "true"
                    : "",
              })
            }
          />

          <span>
            In Stock Only
          </span>
        </label>
      </div>

      <div className="products-filter-section">
        <h4>
          Product Type
        </h4>

        <label className="products-checkbox-row">
          <input
            type="checkbox"
            checked={
              featured
            }
            onChange={(
              event
            ) =>
              updateQuery({
                featured:
                  event.target
                    .checked
                    ? "true"
                    : "",
              })
            }
          />

          <span>
            Featured Products
          </span>
        </label>
      </div>
    </>
  );

  return (
    <main className="products-page">
      <section className="products-page-hero">
        <div className="container">
          <span className="section-eyebrow">
            NovaCart Store
          </span>

          <h1>
            Explore Our Products
          </h1>

          <p>
            Search, filter, and discover
            products across the NovaCart
            collection.
          </p>
        </div>
      </section>

      <section className="products-main-section section-spacing">
        <div className="container">
          <div className="products-mobile-toolbar">
            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(
                  true
                )
              }
            >
              <FaFilter />

              Filters
            </button>

            <span>
              {
                pagination.totalProducts
              }{" "}
              product
              {pagination.totalProducts ===
              1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="products-layout">
            <aside className="products-sidebar">
              {filterContent}
            </aside>

            <div className="products-content">
              <div className="products-toolbar">
                <div>
                  <strong>
                    {
                      pagination.totalProducts
                    }{" "}
                    Product
                    {pagination.totalProducts ===
                    1
                      ? ""
                      : "s"}
                  </strong>

                  {search && (
                    <span>
                      Results for "
                      {search}"
                    </span>
                  )}
                </div>

                <div className="products-sort">
                  <label htmlFor="product-sort">
                    Sort by
                  </label>

                  <select
                    id="product-sort"
                    value={
                      sort
                    }
                    onChange={(
                      event
                    ) =>
                      updateQuery({
                        sort:
                          event.target
                            .value,
                      })
                    }
                  >
                    <option value="newest">
                      Newest
                    </option>

                    <option value="oldest">
                      Oldest
                    </option>

                    <option value="price_low">
                      Price: Low to High
                    </option>

                    <option value="price_high">
                      Price: High to Low
                    </option>

                    <option value="popular">
                      Most Popular
                    </option>

                    <option value="rating">
                      Highest Rated
                    </option>

                    <option value="name_az">
                      Name A-Z
                    </option>

                    <option value="name_za">
                      Name Z-A
                    </option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="products-active-filters">
                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        updateQuery({
                          search: "",
                        })
                      }
                    >
                      Search:{" "}
                      {search}
                      <FaTimes />
                    </button>
                  )}

                  {category && (
                    <button
                      type="button"
                      onClick={() =>
                        updateQuery({
                          category: "",
                          brand: "",
                        })
                      }
                    >
                      {category}
                      <FaTimes />
                    </button>
                  )}

                  {brand && (
                    <button
                      type="button"
                      onClick={() =>
                        updateQuery({
                          brand: "",
                        })
                      }
                    >
                      {brand}
                      <FaTimes />
                    </button>
                  )}

                  {(minPrice ||
                    maxPrice) && (
                    <button
                      type="button"
                      onClick={() =>
                        updateQuery({
                          minPrice: "",
                          maxPrice: "",
                        })
                      }
                    >
                      Price Filter
                      <FaTimes />
                    </button>
                  )}

                  {inStock && (
                    <button
                      type="button"
                      onClick={() =>
                        updateQuery({
                          inStock: "",
                        })
                      }
                    >
                      In Stock
                      <FaTimes />
                    </button>
                  )}

                  {featured && (
                    <button
                      type="button"
                      onClick={() =>
                        updateQuery({
                          featured: "",
                        })
                      }
                    >
                      Featured
                      <FaTimes />
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <Loader
                  text="Loading products..."
                />
              ) : error ? (
                <div className="products-error-state">
                  <h3>
                    Unable to load products
                  </h3>

                  <p>
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadProducts
                    }
                    className="primary-button"
                  >
                    Try Again
                  </button>
                </div>
              ) : products.length >
                0 ? (
                <>
                  <div className="product-grid">
                    {products.map(
                      (
                        product
                      ) => (
                        <ProductCard
                          key={
                            product._id
                          }
                          product={
                            product
                          }
                        />
                      )
                    )}
                  </div>

                  {pagination.totalPages >
                    1 && (
                    <div className="products-pagination">
                      <button
                        type="button"
                        disabled={
                          !pagination.hasPreviousPage
                        }
                        onClick={() =>
                          updateQuery(
                            {
                              page:
                                pagination.page -
                                1,
                            },
                            {
                              resetPage:
                                false,
                            }
                          )
                        }
                      >
                        Previous
                      </button>

                      <div className="products-page-numbers">
                        {Array.from(
                          {
                            length:
                              pagination.totalPages,
                          },
                          (
                            _,
                            index
                          ) =>
                            index +
                            1
                        )
                          .filter(
                            (
                              pageNumber
                            ) =>
                              pageNumber ===
                                1 ||
                              pageNumber ===
                                pagination.totalPages ||
                              Math.abs(
                                pageNumber -
                                  pagination.page
                              ) <=
                                1
                          )
                          .map(
                            (
                              pageNumber,
                              index,
                              visiblePages
                            ) => {
                              const previous =
                                visiblePages[
                                  index -
                                    1
                                ];

                              const showDots =
                                previous &&
                                pageNumber -
                                  previous >
                                  1;

                              return (
                                <span
                                  key={
                                    pageNumber
                                  }
                                >
                                  {showDots && (
                                    <span className="products-pagination-dots">
                                      ...
                                    </span>
                                  )}

                                  <button
                                    type="button"
                                    className={
                                      pageNumber ===
                                      pagination.page
                                        ? "active"
                                        : ""
                                    }
                                    onClick={() =>
                                      updateQuery(
                                        {
                                          page:
                                            pageNumber,
                                        },
                                        {
                                          resetPage:
                                            false,
                                        }
                                      )
                                    }
                                  >
                                    {
                                      pageNumber
                                    }
                                  </button>
                                </span>
                              );
                            }
                          )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          !pagination.hasNextPage
                        }
                        onClick={() =>
                          updateQuery(
                            {
                              page:
                                pagination.page +
                                1,
                            },
                            {
                              resetPage:
                                false,
                            }
                          )
                        }
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="products-empty-state">
                  <FaSearch />

                  <h3>
                    No products found
                  </h3>

                  <p>
                    Try changing your
                    search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="primary-button"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        className={`products-mobile-overlay ${
          mobileFiltersOpen
            ? "open"
            : ""
        }`}
        onClick={() =>
          setMobileFiltersOpen(
            false
          )
        }
      />

      <aside
        className={`products-mobile-filters ${
          mobileFiltersOpen
            ? "open"
            : ""
        }`}
      >
        <div className="products-mobile-filter-header">
          <h3>
            Filter Products
          </h3>

          <button
            type="button"
            onClick={() =>
              setMobileFiltersOpen(
                false
              )
            }
            aria-label="Close filters"
          >
            <FaTimes />
          </button>
        </div>

        <div className="products-mobile-filter-body">
          {filterContent}
        </div>
      </aside>
    </main>
  );
};

export default Products;