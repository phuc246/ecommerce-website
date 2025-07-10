// Validation rules for the e-commerce system
export const VALIDATION_RULES = {
  // Product validation
  PRODUCT: {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 1,
    DESCRIPTION_MAX_LENGTH: 2000,
    PRICE_MIN: 0,
    PRICE_MAX: 1000000000, // 1 billion VND
    QUANTITY_MIN: 0,
    QUANTITY_MAX: 999999,
    SKU_MAX_LENGTH: 50,
  },
  
  // User validation
  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 255,
    PHONE_PATTERN: /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/,
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 100,
  },
  
  // Address validation
  ADDRESS: {
    FULL_NAME_MIN_LENGTH: 2,
    FULL_NAME_MAX_LENGTH: 100,
    PHONE_PATTERN: /^(0|\+84)(3[2-9]|5[689]|7[06-9]|8[1-689]|9[0-46-9])[0-9]{7}$/,
    ADDRESS_MIN_LENGTH: 10,
    ADDRESS_MAX_LENGTH: 500,
  },
  
  // Cart validation
  CART: {
    QUANTITY_MIN: 1,
    QUANTITY_MAX: 99,
    MAX_ITEMS: 50,
  },
  
  // Order validation
  ORDER: {
    MAX_ITEMS: 50,
    SHIPPING_ADDRESS_MIN_LENGTH: 10,
    SHIPPING_ADDRESS_MAX_LENGTH: 500,
  },
  
  // File validation
  FILE: {
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    IMAGE_ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    MAX_IMAGES_PER_PRODUCT: 10,
  },
};

// Validation functions
export const validateProduct = (data: any) => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < VALIDATION_RULES.PRODUCT.NAME_MIN_LENGTH) {
    errors.push('Tên sản phẩm không được để trống');
  }
  
  if (data.name && data.name.length > VALIDATION_RULES.PRODUCT.NAME_MAX_LENGTH) {
    errors.push(`Tên sản phẩm không được quá ${VALIDATION_RULES.PRODUCT.NAME_MAX_LENGTH} ký tự`);
  }
  
  if (!data.image || data.image.trim().length === 0) {
    errors.push('Ảnh sản phẩm không được để trống');
  }
  
  if (!data.categoryId || data.categoryId.trim().length === 0) {
    errors.push('Danh mục sản phẩm không được để trống');
  }
  
  if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0) {
    errors.push('Sản phẩm phải có ít nhất một biến thể');
  }
  
  return errors;
};

export const validateVariant = (variant: any, index: number) => {
  const errors: string[] = [];
  
  if (!variant.color || variant.color.trim().length === 0) {
    errors.push(`Biến thể ${index + 1}: Tên màu không được để trống`);
  }
  
  if (variant.price == null || isNaN(parseFloat(variant.price)) || parseFloat(variant.price) < VALIDATION_RULES.PRODUCT.PRICE_MIN) {
    errors.push(`Biến thể ${index + 1}: Giá phải là số dương`);
  }
  
  if (parseFloat(variant.price) > VALIDATION_RULES.PRODUCT.PRICE_MAX) {
    errors.push(`Biến thể ${index + 1}: Giá không được quá ${VALIDATION_RULES.PRODUCT.PRICE_MAX.toLocaleString()} VNĐ`);
  }
  
  if (!Array.isArray(variant.sizes) || variant.sizes.length === 0) {
    errors.push(`Biến thể ${index + 1}: Phải có ít nhất một kích thước`);
  }
  
  return errors;
};

export const validateSize = (size: any, variantIndex: number, sizeIndex: number) => {
  const errors: string[] = [];
  
  if (!size.size || size.size.trim().length === 0) {
    errors.push(`Biến thể ${variantIndex + 1}, Kích thước ${sizeIndex + 1}: Tên size không được để trống`);
  }
  
  if (size.stock == null || isNaN(parseInt(size.stock)) || parseInt(size.stock) < VALIDATION_RULES.PRODUCT.QUANTITY_MIN) {
    errors.push(`Biến thể ${variantIndex + 1}, Kích thước ${sizeIndex + 1}: Số lượng phải là số >= ${VALIDATION_RULES.PRODUCT.QUANTITY_MIN}`);
  }
  
  if (parseInt(size.stock) > VALIDATION_RULES.PRODUCT.QUANTITY_MAX) {
    errors.push(`Biến thể ${variantIndex + 1}, Kích thước ${sizeIndex + 1}: Số lượng không được quá ${VALIDATION_RULES.PRODUCT.QUANTITY_MAX.toLocaleString()}`);
  }
  
  return errors;
};

export const validateUser = (data: any) => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < VALIDATION_RULES.USER.NAME_MIN_LENGTH) {
    errors.push('Họ tên không được để trống');
  }
  
  if (data.name && data.name.length > VALIDATION_RULES.USER.NAME_MAX_LENGTH) {
    errors.push(`Họ tên không được quá ${VALIDATION_RULES.USER.NAME_MAX_LENGTH} ký tự`);
  }
  
  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email không được để trống');
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email không hợp lệ');
  }
  
  if (data.email && data.email.length > VALIDATION_RULES.USER.EMAIL_MAX_LENGTH) {
    errors.push(`Email không được quá ${VALIDATION_RULES.USER.EMAIL_MAX_LENGTH} ký tự`);
  }
  
  if (data.phone && !VALIDATION_RULES.USER.PHONE_PATTERN.test(data.phone)) {
    errors.push('Số điện thoại không hợp lệ');
  }
  
  return errors;
};

export const validateAddress = (data: any) => {
  const errors: string[] = [];
  
  if (!data.fullName || data.fullName.trim().length < VALIDATION_RULES.ADDRESS.FULL_NAME_MIN_LENGTH) {
    errors.push('Họ tên không được để trống');
  }
  
  if (data.fullName && data.fullName.length > VALIDATION_RULES.ADDRESS.FULL_NAME_MAX_LENGTH) {
    errors.push(`Họ tên không được quá ${VALIDATION_RULES.ADDRESS.FULL_NAME_MAX_LENGTH} ký tự`);
  }
  
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push('Số điện thoại không được để trống');
  }
  
  if (data.phone && !VALIDATION_RULES.ADDRESS.PHONE_PATTERN.test(data.phone)) {
    errors.push('Số điện thoại không hợp lệ');
  }
  
  if (!data.address || data.address.trim().length < VALIDATION_RULES.ADDRESS.ADDRESS_MIN_LENGTH) {
    errors.push('Địa chỉ không được để trống');
  }
  
  if (data.address && data.address.length > VALIDATION_RULES.ADDRESS.ADDRESS_MAX_LENGTH) {
    errors.push(`Địa chỉ không được quá ${VALIDATION_RULES.ADDRESS.ADDRESS_MAX_LENGTH} ký tự`);
  }
  
  return errors;
};

export const validateCartItem = (data: any) => {
  const errors: string[] = [];
  
  if (!data.productId || data.productId.trim().length === 0) {
    errors.push('ID sản phẩm không được để trống');
  }
  
  if (!data.colorId || data.colorId.trim().length === 0) {
    errors.push('Màu sắc không được để trống');
  }
  
  if (!data.sizeId || data.sizeId.trim().length === 0) {
    errors.push('Kích thước không được để trống');
  }
  
  if (!data.quantity || data.quantity < VALIDATION_RULES.CART.QUANTITY_MIN) {
    errors.push(`Số lượng phải lớn hơn hoặc bằng ${VALIDATION_RULES.CART.QUANTITY_MIN}`);
  }
  
  if (data.quantity > VALIDATION_RULES.CART.QUANTITY_MAX) {
    errors.push(`Số lượng không được quá ${VALIDATION_RULES.CART.QUANTITY_MAX}`);
  }
  
  return errors;
};

export const validateOrder = (data: any) => {
  const errors: string[] = [];
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Giỏ hàng trống');
  }
  
  if (data.items && data.items.length > VALIDATION_RULES.ORDER.MAX_ITEMS) {
    errors.push(`Đơn hàng không được quá ${VALIDATION_RULES.ORDER.MAX_ITEMS} sản phẩm`);
  }
  
  if (!data.shippingAddress || data.shippingAddress.trim().length < VALIDATION_RULES.ORDER.SHIPPING_ADDRESS_MIN_LENGTH) {
    errors.push('Địa chỉ giao hàng không được để trống');
  }
  
  if (data.shippingAddress && data.shippingAddress.length > VALIDATION_RULES.ORDER.SHIPPING_ADDRESS_MAX_LENGTH) {
    errors.push(`Địa chỉ giao hàng không được quá ${VALIDATION_RULES.ORDER.SHIPPING_ADDRESS_MAX_LENGTH} ký tự`);
  }
  
  if (!data.paymentMethod || data.paymentMethod.trim().length === 0) {
    errors.push('Phương thức thanh toán không được để trống');
  }
  
  return errors;
};

export const validateFile = (file: File) => {
  const errors: string[] = [];
  
  if (file.size > VALIDATION_RULES.FILE.IMAGE_MAX_SIZE) {
    errors.push(`Kích thước file không được quá ${VALIDATION_RULES.FILE.IMAGE_MAX_SIZE / (1024 * 1024)}MB`);
  }
  
  if (!VALIDATION_RULES.FILE.IMAGE_ALLOWED_TYPES.includes(file.type)) {
    errors.push('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)');
  }
  
  return errors;
};

// Utility functions
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return VALIDATION_RULES.USER.PHONE_PATTERN.test(phone);
};

export const isValidPrice = (price: number): boolean => {
  return price >= VALIDATION_RULES.PRODUCT.PRICE_MIN && price <= VALIDATION_RULES.PRODUCT.PRICE_MAX;
};

export const isValidQuantity = (quantity: number): boolean => {
  return quantity >= VALIDATION_RULES.CART.QUANTITY_MIN && quantity <= VALIDATION_RULES.CART.QUANTITY_MAX;
}; 