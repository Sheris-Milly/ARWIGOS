/**
 * Data Transfer Objects (DTOs) for request/response validation
 * This module provides validation for API requests and responses.
 */

// Validation helper
function validate(schema, data) {
  const errors = {};
  
  for (const [key, config] of Object.entries(schema)) {
    // Check required fields
    if (config.required && (data[key] === undefined || data[key] === null)) {
      errors[key] = 'Field is required';
      continue;
    }
    
    // Skip validation if field is not present and not required
    if (data[key] === undefined || data[key] === null) {
      continue;
    }
    
    // Type validation
    if (config.type && typeof data[key] !== config.type) {
      errors[key] = `Expected type ${config.type}, got ${typeof data[key]}`;
      continue;
    }
    
    // Custom validation
    if (config.validate && !config.validate(data[key])) {
      errors[key] = config.message || 'Validation failed';
    }
  }
  
  return Object.keys(errors).length ? errors : null;
}

// Chat Input schema
export const chatInputSchema = {
  message: { 
    required: true, 
    type: 'string',
    validate: val => val.trim().length > 0,
    message: 'Message cannot be empty'
  },
  context: { 
    required: false, 
    type: 'object' 
  }
};

// Chat Output schema
export const chatOutputSchema = {
  message: { required: true, type: 'string' },
  agent_name: { required: true, type: 'string' },
  agent_display_name: { required: true, type: 'string' },
  agent_icon: { required: true, type: 'string' },
  agent_color: { required: true, type: 'string' },
  conversation_id: { required: true, type: 'string' },
  conversation_title: { required: false, type: 'string' },
  created_at: { required: true, type: 'string' }
};

// Validate request middleware
export function validateRequest(schema) {
  return (req, res, next) => {
    const errors = validate(schema, req.body);
    if (errors) {
      return res.status(400).json({ errors });
    }
    next();
  };
}

// Validate response before sending
export function validateResponse(schema, data) {
  const errors = validate(schema, data);
  if (errors) {
    console.error('Response validation failed:', errors);
    throw new Error(`Response validation failed: ${JSON.stringify(errors)}`);
  }
  return data;
}

export default {
  validateRequest,
  validateResponse,
  chatInputSchema,
  chatOutputSchema
};
