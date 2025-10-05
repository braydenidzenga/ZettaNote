import { z } from 'zod';

const passwordSchema = z
  .string()
  .trim()
  .min(12, { message: 'Password must be of 12 characters' })
  .refine((val) => /\d/.test(val), {
    message: 'Password must have at least 1 digit',
  })
  .refine((val) => /[^a-zA-Z0-9]/.test(val), {
    message: 'Password must have at least 1 symbol',
  });

export default function validatePass(password) {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return {
      resStatus: 400,
      resMessage: { Error: JSON.parse(result.error)[0].message },
    };
  }
  return {
    resStatus: 200,
    resMessage: { message: 'Password is valid' },
  };
}
