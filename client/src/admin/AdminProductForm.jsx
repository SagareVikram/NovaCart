import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaBoxOpen,
  FaImage,
  FaPlus,
  FaSave,
  FaTags,
  FaTrash,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const emptySpecification = {
  key: "",
  value: "",
};

const initialForm = {
  name: "",
  shortDescription: "",
  description: "",
  category: "",
  subCategory: "",
  brand: "",
  sku: "",
  price: "",
  discountPrice: "",
  stock: "",
  lowStockThreshold: "5",
  tags: "",
  isFeatured: false,
  isActive: true,
};

const AdminProductForm = () => {
  const { productId } = useParams();

  const navigate = useNavigate();

  const isEditing = Boolean(productId);

  const [formData, setFormData] =
    useState(initialForm);

  const [
    specifications,
    setSpecifications,
  ] = useState([
    {
      ...emptySpecification,
    },
  ]);

  const [
    existingImages,
    setExistingImages,
  ] = useState([]);

  const [
    newImages,
    setNewImages,
  ] = useState([]);

  const [
    replaceImages,
    setReplaceImages,
  ] = useState(false);

  const [
    imagePreviewUrls,
    setImagePreviewUrls,
  ] = useState([]);

  const [loading, setLoading] =
    useState(isEditing);

  const [saving, setSaving] =
    useState(false);

  const [
    deletingImageId,
    setDeletingImageId,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /**
   * Keep the entire form synchronized
   * with a product object returned by
   * the backend.
   */
  const applyProductToForm =
    useCallback((product) => {
      if (!product) {
        return;
      }

      setFormData({
        name:
          product.name || "",

        shortDescription:
          product.shortDescription ||
          "",

        description:
          product.description ||
          "",

        category:
          product.category || "",

        subCategory:
          product.subCategory ||
          "",

        brand:
          product.brand || "",

        sku:
          product.sku || "",

        price:
          product.price ??
          "",

        discountPrice:
          product.discountPrice ??
          "",

        stock:
          product.stock ??
          "",

        lowStockThreshold:
          product.lowStockThreshold ??
          5,

        tags:
          Array.isArray(
            product.tags
          )
            ? product.tags.join(
                ", "
              )
            : product.tags ||
              "",

        isFeatured:
          Boolean(
            product.isFeatured
          ),

        isActive:
          Boolean(
            product.isActive
          ),
      });

      setSpecifications(
        Array.isArray(
          product.specifications
        ) &&
        product.specifications.length >
          0
          ? product.specifications.map(
              (item) => ({
                key:
                  item.key ||
                  "",
                value:
                  item.value ||
                  "",
              })
            )
          : [
              {
                ...emptySpecification,
              },
            ]
      );

      setExistingImages(
        Array.isArray(
          product.images
        )
          ? product.images
          : []
      );
    }, []);

  /**
   * Load product during edit mode.
   *
   * Backend:
   * GET /api/admin/products/:productId
   */
  const loadProduct =
    useCallback(async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/admin/products/${productId}`
          );

        const product =
          response.data?.product;

        if (!product) {
          throw new Error(
            "Product details were not returned by the server."
          );
        }

        applyProductToForm(
          product
        );

        setNewImages([]);
        setReplaceImages(false);
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to load product details."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      isEditing,
      productId,
      applyProductToForm,
    ]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  /**
   * Generate local previews for newly
   * selected image files.
   */
  useEffect(() => {
    const previews =
      newImages.map(
        (file) =>
          URL.createObjectURL(
            file
          )
      );

    setImagePreviewUrls(
      previews
    );

    return () => {
      previews.forEach(
        (url) => {
          URL.revokeObjectURL(
            url
          );
        }
      );
    };
  }, [newImages]);

  /**
   * Final image count after save.
   *
   * If replaceImages is enabled,
   * existing images will be discarded
   * by the backend and only new images
   * remain.
   */
  const totalImages =
    useMemo(() => {
      const oldImageCount =
        replaceImages
          ? 0
          : existingImages.length;

      return (
        oldImageCount +
        newImages.length
      );
    }, [
      replaceImages,
      existingImages,
      newImages,
    ]);

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );

    setError("");
    setMessage("");
  };

  const handleSpecificationChange =
    (
      index,
      field,
      value
    ) => {
      setSpecifications(
        (current) =>
          current.map(
            (
              item,
              itemIndex
            ) =>
              itemIndex ===
              index
                ? {
                    ...item,
                    [field]:
                      value,
                  }
                : item
          )
      );

      setError("");
      setMessage("");
    };

  const addSpecification = () => {
    setSpecifications(
      (current) => [
        ...current,
        {
          ...emptySpecification,
        },
      ]
    );
  };

  const removeSpecification = (
    index
  ) => {
    setSpecifications(
      (current) => {
        const next =
          current.filter(
            (
              _,
              itemIndex
            ) =>
              itemIndex !==
              index
          );

        return next.length > 0
          ? next
          : [
              {
                ...emptySpecification,
              },
            ];
      }
    );
  };

  /**
   * Validate images before they are
   * sent to Multer/Cloudinary.
   *
   * Backend rules:
   * - JPG/JPEG/PNG/WEBP
   * - Max 5 MB each
   * - Max 6 uploaded images
   * - Product model max 6 total images
   */
  const handleImagesChange = (
    event
  ) => {
    const files =
      Array.from(
        event.target.files ||
          []
      );

    event.target.value = "";

    if (!files.length) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    const invalidFile =
      files.find(
        (file) =>
          !allowedTypes.includes(
            file.type
          )
      );

    if (invalidFile) {
      setError(
        `"${invalidFile.name}" is not supported. Only JPG, JPEG, PNG and WEBP images are allowed.`
      );

      return;
    }

    const oversizedFile =
      files.find(
        (file) =>
          file.size >
          5 *
            1024 *
            1024
      );

    if (oversizedFile) {
      setError(
        `"${oversizedFile.name}" exceeds the 5 MB image limit.`
      );

      return;
    }

    /**
     * Multer upload.array("images", 6)
     * also means one request cannot
     * contain more than 6 new files.
     */
    if (
      newImages.length +
        files.length >
      6
    ) {
      setError(
        "You can upload a maximum of 6 new images in one save."
      );

      return;
    }

    const oldImageCount =
      replaceImages
        ? 0
        : existingImages.length;

    const finalCount =
      oldImageCount +
      newImages.length +
      files.length;

    if (
      finalCount > 6
    ) {
      setError(
        "A product can have a maximum of 6 images."
      );

      return;
    }

    setNewImages(
      (current) => [
        ...current,
        ...files,
      ]
    );

    setError("");
    setMessage("");
  };

  const removeNewImage = (
    index
  ) => {
    setNewImages(
      (current) =>
        current.filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )
    );

    setError("");
  };

  /**
   * Permanently remove one currently
   * saved Cloudinary image.
   *
   * Backend:
   * DELETE
   * /admin/products/:productId/images/:publicId
   */
  const deleteExistingImage =
    async (image) => {
      if (
        !image?.publicId ||
        !productId
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Delete this product image permanently?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingImageId(
          image.publicId
        );

        setError("");
        setMessage("");

        const response =
          await api.delete(
            `/admin/products/${productId}/images/${encodeURIComponent(
              image.publicId
            )}`
          );

        /**
         * Prefer the product returned by
         * the backend so local state stays
         * fully synchronized.
         */
        if (
          response.data?.product
        ) {
          setExistingImages(
            Array.isArray(
              response.data.product
                .images
            )
              ? response.data.product
                  .images
              : []
          );
        } else {
          setExistingImages(
            (current) =>
              current.filter(
                (item) =>
                  item.publicId !==
                  image.publicId
              )
          );
        }

        setMessage(
          response.data?.message ||
            "Product image deleted successfully."
        );
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to delete product image."
          )
        );
      } finally {
        setDeletingImageId(
          ""
        );
      }
    };

  /**
   * Validate the form using the exact
   * Product model constraints.
   */
  const validateForm = () => {
    const name =
      formData.name.trim();

    const shortDescription =
      formData.shortDescription.trim();

    const description =
      formData.description.trim();

    const category =
      formData.category.trim();

    const subCategory =
      formData.subCategory.trim();

    const brand =
      formData.brand.trim();

    const sku =
      formData.sku.trim();

    if (!name) {
      return "Product name is required.";
    }

    if (name.length < 2) {
      return "Product name must contain at least 2 characters.";
    }

    if (
      name.length > 180
    ) {
      return "Product name cannot exceed 180 characters.";
    }

    if (!shortDescription) {
      return "Short description is required.";
    }

    if (
      shortDescription.length >
      300
    ) {
      return "Short description cannot exceed 300 characters.";
    }

    if (!description) {
      return "Product description is required.";
    }

    if (
      description.length >
      5000
    ) {
      return "Product description cannot exceed 5000 characters.";
    }

    if (!category) {
      return "Category is required.";
    }

    if (
      category.length > 100
    ) {
      return "Category cannot exceed 100 characters.";
    }

    if (
      subCategory.length > 100
    ) {
      return "Sub category cannot exceed 100 characters.";
    }

    if (
      brand.length > 100
    ) {
      return "Brand cannot exceed 100 characters.";
    }

    if (!sku) {
      return "SKU is required.";
    }

    if (
      sku.length > 80
    ) {
      return "SKU cannot exceed 80 characters.";
    }

    const price =
      Number(
        formData.price
      );

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      return "Price must be a valid number greater than or equal to 0.";
    }

    if (
      formData.discountPrice !==
      ""
    ) {
      const discountPrice =
        Number(
          formData.discountPrice
        );

      if (
        !Number.isFinite(
          discountPrice
        ) ||
        discountPrice < 0
      ) {
        return "Discount price must be a valid number greater than or equal to 0.";
      }

      if (
        discountPrice >=
        price
      ) {
        return "Discount price must be lower than the regular price.";
      }
    }

    const stock =
      Number(
        formData.stock
      );

    if (
      !Number.isInteger(
        stock
      ) ||
      stock < 0
    ) {
      return "Stock must be a whole number greater than or equal to 0.";
    }

    const lowStockThreshold =
      Number(
        formData.lowStockThreshold
      );

    if (
      !Number.isInteger(
        lowStockThreshold
      ) ||
      lowStockThreshold < 0
    ) {
      return "Low stock threshold must be a whole number greater than or equal to 0.";
    }

    /**
     * Reject half-filled specification
     * rows instead of silently dropping
     * them.
     */
    for (
      let index = 0;
      index <
      specifications.length;
      index += 1
    ) {
      const key =
        specifications[
          index
        ].key.trim();

      const value =
        specifications[
          index
        ].value.trim();

      const bothEmpty =
        !key && !value;

      if (bothEmpty) {
        continue;
      }

      if (!key || !value) {
        return `Specification ${index + 1} must contain both a name and a value.`;
      }

      if (
        key.length > 100
      ) {
        return `Specification ${index + 1} name cannot exceed 100 characters.`;
      }

      if (
        value.length > 250
      ) {
        return `Specification ${index + 1} value cannot exceed 250 characters.`;
      }
    }

    /**
     * New products should have at least
     * one image for the storefront.
     */
    if (
      !isEditing &&
      newImages.length === 0
    ) {
      return "Please upload at least one product image.";
    }

    /**
     * If admin explicitly chooses
     * replace-images, the backend requires
     * new uploaded images for replacement
     * to actually happen.
     */
    if (
      isEditing &&
      replaceImages &&
      newImages.length === 0
    ) {
      return "Select at least one new image when Replace existing images is enabled.";
    }

    if (
      totalImages > 6
    ) {
      return "A product can have a maximum of 6 images.";
    }

    return "";
  };

  /**
   * Build multipart/form-data expected
   * by createProduct/updateProduct.
   */
  const buildPayload = () => {
    const payload =
      new FormData();

    payload.append(
      "name",
      formData.name.trim()
    );

    payload.append(
      "shortDescription",
      formData.shortDescription.trim()
    );

    payload.append(
      "description",
      formData.description.trim()
    );

    payload.append(
      "category",
      formData.category.trim()
    );

    payload.append(
      "subCategory",
      formData.subCategory.trim()
    );

    payload.append(
      "brand",
      formData.brand.trim()
    );

    payload.append(
      "sku",
      formData.sku
        .trim()
        .toUpperCase()
    );

    payload.append(
      "price",
      String(
        Number(
          formData.price
        )
      )
    );

    payload.append(
      "discountPrice",
      formData.discountPrice ===
        ""
        ? ""
        : String(
            Number(
              formData.discountPrice
            )
          )
    );

    payload.append(
      "stock",
      String(
        Number(
          formData.stock
        )
      )
    );

    payload.append(
      "lowStockThreshold",
      String(
        Number(
          formData.lowStockThreshold
        )
      )
    );

    const cleanSpecifications =
      specifications
        .map((item) => ({
          key:
            item.key.trim(),

          value:
            item.value.trim(),
        }))
        .filter(
          (item) =>
            item.key &&
            item.value
        );

    /**
     * Backend parseSpecifications()
     * accepts JSON string.
     */
    payload.append(
      "specifications",
      JSON.stringify(
        cleanSpecifications
      )
    );

    /**
     * Backend parseTags() accepts a
     * comma-separated string.
     */
    payload.append(
      "tags",
      formData.tags.trim()
    );

    /**
     * Backend parseBoolean() accepts
     * "true" and "false".
     */
    payload.append(
      "isFeatured",
      String(
        formData.isFeatured
      )
    );

    payload.append(
      "isActive",
      String(
        formData.isActive
      )
    );

    if (isEditing) {
      payload.append(
        "replaceImages",
        String(
          replaceImages
        )
      );
    }

    /**
     * Must match:
     * upload.array("images", 6)
     */
    newImages.forEach(
      (file) => {
        payload.append(
          "images",
          file
        );
      }
    );

    return payload;
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      setError("");
      setMessage("");

      const validationError =
        validateForm();

      if (validationError) {
        setError(
          validationError
        );

        return;
      }

      try {
        setSaving(true);

        const payload =
          buildPayload();

        const response =
          isEditing
            ? await api.put(
                `/admin/products/${productId}`,
                payload
              )
            : await api.post(
                "/admin/products",
                payload
              );

        const savedProduct =
          response.data?.product;

        if (!savedProduct) {
          throw new Error(
            "Product was saved, but the updated product data was not returned."
          );
        }

        setMessage(
          response.data?.message ||
            (isEditing
              ? "Product updated successfully."
              : "Product created successfully.")
        );

        /**
         * Edit mode:
         * Synchronize immediately from
         * returned backend product.
         *
         * This fixes stale image previews
         * and stale image counts after
         * uploading/replacing images.
         */
        if (isEditing) {
          applyProductToForm(
            savedProduct
          );

          setNewImages([]);
          setReplaceImages(false);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        /**
         * Create mode:
         * Move to edit route for newly
         * created product.
         */
        navigate(
          `/admin/products/${savedProduct._id}/edit`,
          {
            replace: true,
          }
        );
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            isEditing
              ? "Unable to update product."
              : "Unable to create product."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  if (loading) {
    return (
      <main className="admin-page admin-product-form-page">
        <Loader
          fullPage
          text="Loading product..."
        />
      </main>
    );
  }

  return (
    <main className="admin-page admin-product-form-page">
      <div className="admin-page-header">
        <div>
          <Link
            to="/admin/products"
            className="admin-back-link"
          >
            <FaArrowLeft />

            Back to Products
          </Link>

          <span className="admin-eyebrow">
            Product Management
          </span>

          <h1>
            {isEditing
              ? "Edit Product"
              : "Add Product"}
          </h1>

          <p>
            {isEditing
              ? "Update product information, pricing, inventory, specifications, images, and storefront visibility."
              : "Create a complete NovaCart product with pricing, inventory, specifications, and storefront images."}
          </p>
        </div>
      </div>

      {message && (
        <div className="admin-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-message error">
          <div>
            <strong>
              Product could not be saved
            </strong>

            <p>
              {error}
            </p>
          </div>
        </div>
      )}

      <form
        className="admin-product-form-layout"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="admin-product-form-main">
          {/* =================================================
              BASIC PRODUCT INFORMATION
          ================================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Basic Information
                </span>

                <h2>
                  Product Details
                </h2>
              </div>

              <FaBoxOpen className="admin-card-header-icon" />
            </div>

            <div className="admin-form-grid">
              <div className="form-group admin-form-full">
                <label htmlFor="product-name">
                  Product Name *
                </label>

                <input
                  id="product-name"
                  name="name"
                  type="text"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product name"
                  minLength={2}
                  maxLength={180}
                  required
                />

                <small>
                  Maximum 180 characters.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="product-category">
                  Category *
                </label>

                <input
                  id="product-category"
                  name="category"
                  type="text"
                  value={
                    formData.category
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Electronics"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-subcategory">
                  Sub Category
                </label>

                <input
                  id="product-subcategory"
                  name="subCategory"
                  type="text"
                  value={
                    formData.subCategory
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Smartphones"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-brand">
                  Brand
                </label>

                <input
                  id="product-brand"
                  name="brand"
                  type="text"
                  value={
                    formData.brand
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: Samsung"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-sku">
                  SKU *
                </label>

                <input
                  id="product-sku"
                  name="sku"
                  type="text"
                  value={
                    formData.sku
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Example: NOVA-SAM-001"
                  maxLength={80}
                  required
                />

                <small>
                  SKU is saved in uppercase and must be unique.
                </small>
              </div>

              <div className="form-group admin-form-full">
                <label htmlFor="product-short-description">
                  Short Description *
                </label>

                <textarea
                  id="product-short-description"
                  name="shortDescription"
                  rows={3}
                  value={
                    formData.shortDescription
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Short product summary"
                  maxLength={300}
                  required
                />

                <small>
                  {
                    formData.shortDescription
                      .length
                  }
                  /300
                </small>
              </div>

              <div className="form-group admin-form-full">
                <label htmlFor="product-description">
                  Full Description *
                </label>

                <textarea
                  id="product-description"
                  name="description"
                  rows={8}
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter complete product description"
                  maxLength={5000}
                  required
                />

                <small>
                  {
                    formData.description
                      .length
                  }
                  /5000
                </small>
              </div>
            </div>
          </section>

          {/* =================================================
              PRICING & INVENTORY
          ================================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Pricing & Inventory
                </span>

                <h2>
                  Price and Stock
                </h2>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="product-price">
                  Regular Price *
                </label>

                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formData.price
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-discount-price">
                  Discount Price
                </label>

                <input
                  id="product-discount-price"
                  name="discountPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formData.discountPrice
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                />

                <small>
                  Must be lower than regular price.
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="product-stock">
                  Stock Quantity *
                </label>

                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formData.stock
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="low-stock-threshold">
                  Low Stock Threshold
                </label>

                <input
                  id="low-stock-threshold"
                  name="lowStockThreshold"
                  type="number"
                  min="0"
                  step="1"
                  value={
                    formData.lowStockThreshold
                  }
                  onChange={
                    handleChange
                  }
                />

                <small>
                  Product appears in low-stock reporting when stock reaches this level.
                </small>
              </div>
            </div>
          </section>

          {/* =================================================
              SPECIFICATIONS
          ================================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Technical Details
                </span>

                <h2>
                  Specifications
                </h2>
              </div>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={
                  addSpecification
                }
              >
                <FaPlus />

                Add Specification
              </button>
            </div>

            <div className="admin-specification-list">
              {specifications.map(
                (
                  specification,
                  index
                ) => (
                  <div
                    key={index}
                    className="admin-specification-row"
                  >
                    <input
                      type="text"
                      placeholder="Example: RAM"
                      value={
                        specification.key
                      }
                      maxLength={100}
                      onChange={(
                        event
                      ) =>
                        handleSpecificationChange(
                          index,
                          "key",
                          event.target
                            .value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Example: 8 GB"
                      value={
                        specification.value
                      }
                      maxLength={250}
                      onChange={(
                        event
                      ) =>
                        handleSpecificationChange(
                          index,
                          "value",
                          event.target
                            .value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        removeSpecification(
                          index
                        )
                      }
                      aria-label={`Remove specification ${index + 1}`}
                      title="Remove specification"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )
              )}
            </div>

            <small>
              Leave the single empty row blank if the product does not need specifications.
            </small>
          </section>

          {/* =================================================
              TAGS
          ================================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Search & Discovery
                </span>

                <h2>
                  Product Tags
                </h2>
              </div>

              <FaTags className="admin-card-header-icon" />
            </div>

            <div className="form-group">
              <label htmlFor="product-tags">
                Tags
              </label>

              <input
                id="product-tags"
                name="tags"
                type="text"
                value={
                  formData.tags
                }
                onChange={
                  handleChange
                }
                placeholder="phone, electronics, 5g, smartphone"
              />

              <small>
                Separate multiple tags with commas. Tags are normalized to lowercase by the backend.
              </small>
            </div>
          </section>
        </div>

        {/* ===================================================
            RIGHT SIDEBAR
        ==================================================== */}

        <aside className="admin-product-form-side">
          {/* =================================================
              IMAGES
          ================================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Media
                </span>

                <h2>
                  Product Images
                </h2>
              </div>

              <FaImage className="admin-card-header-icon" />
            </div>

            {isEditing &&
              existingImages.length >
                0 && (
                <div className="admin-existing-images">
                  <h3>
                    Existing Images
                  </h3>

                  <div className="admin-image-grid">
                    {existingImages.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          key={
                            image.publicId ||
                            image.url ||
                            index
                          }
                          className="admin-image-card"
                        >
                          <img
                            src={
                              image.url
                            }
                            alt={
                              image.altText ||
                              formData.name ||
                              "Product"
                            }
                          />

                          <button
                            type="button"
                            onClick={() =>
                              deleteExistingImage(
                                image
                              )
                            }
                            disabled={
                              deletingImageId ===
                              image.publicId ||
                              saving
                            }
                            title="Delete image permanently"
                            aria-label={`Delete image ${index + 1}`}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {isEditing && (
              <label className="admin-replace-images-option">
                <input
                  type="checkbox"
                  checked={
                    replaceImages
                  }
                  disabled={saving}
                  onChange={(
                    event
                  ) => {
                    setReplaceImages(
                      event.target
                        .checked
                    );

                    setError("");
                    setMessage("");
                  }}
                />

                <div>
                  <strong>
                    Replace existing images
                  </strong>

                  <span>
                    When enabled, uploaded images will replace all currently saved images after Save Changes.
                  </span>
                </div>
              </label>
            )}

            <div className="admin-image-upload">
              <label htmlFor="product-images">
                <FaPlus />

                <strong>
                  Upload Images
                </strong>

                <span>
                  JPG, JPEG, PNG or WEBP • Maximum 5 MB each • Maximum 6 images
                </span>
              </label>

              <input
                id="product-images"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                multiple
                disabled={
                  saving ||
                  totalImages >= 6
                }
                onChange={
                  handleImagesChange
                }
              />
            </div>

            {imagePreviewUrls.length >
              0 && (
              <div className="admin-new-images">
                <h3>
                  New Images
                </h3>

                <div className="admin-image-grid">
                  {imagePreviewUrls.map(
                    (
                      url,
                      index
                    ) => (
                      <div
                        key={url}
                        className="admin-image-card"
                      >
                        <img
                          src={url}
                          alt={`New product upload ${index + 1}`}
                        />

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            removeNewImage(
                              index
                            )
                          }
                          title="Remove selected image"
                          aria-label={`Remove selected image ${index + 1}`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="admin-image-count">
              <span>
                Final image count
              </span>

              <strong>
                {totalImages}/6
              </strong>
            </div>

            {replaceImages &&
              newImages.length ===
                0 && (
                <small>
                  Add at least one new image before saving with replacement enabled.
                </small>
              )}
          </section>

          {/* =================================================
              VISIBILITY
          ================================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Visibility
                </span>

                <h2>
                  Store Settings
                </h2>
              </div>
            </div>

            <label className="admin-toggle-row">
              <input
                type="checkbox"
                name="isFeatured"
                checked={
                  formData.isFeatured
                }
                disabled={saving}
                onChange={
                  handleChange
                }
              />

              <div>
                <strong>
                  Featured Product
                </strong>

                <span>
                  Show this product in NovaCart featured sections.
                </span>
              </div>
            </label>

            <label className="admin-toggle-row">
              <input
                type="checkbox"
                name="isActive"
                checked={
                  formData.isActive
                }
                disabled={saving}
                onChange={
                  handleChange
                }
              />

              <div>
                <strong>
                  Active Product
                </strong>

                <span>
                  Allow customers to view and purchase this product.
                </span>
              </div>
            </label>
          </section>

          {/* =================================================
              SAVE
          ================================================= */}

          <section className="admin-card admin-form-action-card">
            <div>
              <strong>
                {isEditing
                  ? "Update Product"
                  : "Create Product"}
              </strong>

              <p>
                Review all information before saving.
              </p>
            </div>

            <button
              type="submit"
              className="admin-primary-button admin-save-product-button"
              disabled={
                saving ||
                Boolean(
                  deletingImageId
                )
              }
            >
              <FaSave />

              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Product"}
            </button>

            <Link
              to="/admin/products"
              className="admin-cancel-link"
            >
              Cancel
            </Link>
          </section>
        </aside>
      </form>
    </main>
  );
};

export default AdminProductForm;