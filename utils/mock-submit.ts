export type SubmitResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function mockSubmit(
  data: Record<string, unknown>,
): Promise<SubmitResult> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (Math.random() > 0.5) {
    return {
      success: true,
      message: `Form submitted successfully! Received ${Object.keys(data).length} field(s).`,
    };
  }

  return {
    success: false,
    message: "Server error: please try again later.",
  };
}
