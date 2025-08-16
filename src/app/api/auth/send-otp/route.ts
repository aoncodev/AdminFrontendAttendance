import { type NextRequest, NextResponse } from "next/server";

interface SendOTPRequest {
  email: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Mock user data - replace with actual database lookup
const mockUsers: User[] = [
  {
    id: 1,
    email: "admin@restaurant.com",
    name: "Admin User",
    role: "admin",
  },
  {
    id: 2,
    email: "manager@restaurant.com",
    name: "Restaurant Manager",
    role: "manager",
  },
];

// In-memory OTP storage (use Redis or database in production)
const otpStorage = new Map<
  string,
  { otp: string; expires: number; attempts: number }
>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mock email sending function
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // In production, integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`📧 Sending OTP to ${email}: ${otp}`);

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return true; // Assume success for demo
}

export async function POST(request: NextRequest) {
  try {
    const body: SendOTPRequest = await request.json();

    // Validate input
    if (!body.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid email format",
          },
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === body.email.toLowerCase()
    );
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "No account found with this email address",
          },
        },
        { status: 404 }
      );
    }

    // Rate limiting: Check if OTP was recently sent
    const existingOTP = otpStorage.get(body.email);
    if (existingOTP && existingOTP.expires > Date.now()) {
      const timeLeft = Math.ceil((existingOTP.expires - Date.now()) / 1000);
      if (timeLeft > 240) {
        // Don't allow resend if more than 4 minutes left
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: `Please wait ${Math.ceil(
                timeLeft / 60
              )} minutes before requesting a new code`,
            },
          },
          { status: 429 }
        );
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresIn = 300; // 5 minutes
    const expiresAt = Date.now() + expiresIn * 1000;

    // Store OTP
    otpStorage.set(body.email, {
      otp,
      expires: expiresAt,
      attempts: 0,
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(body.email, otp);

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_SEND_FAILED",
            message: "Failed to send verification code. Please try again.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Verification code sent successfully",
        expires_in: expiresIn,
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
