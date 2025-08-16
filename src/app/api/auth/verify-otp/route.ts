import { type NextRequest, NextResponse } from "next/server";

interface VerifyOTPRequest {
  email: string;
  otp: string;
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

// Mock JWT token generation - replace with actual JWT library
function generateMockToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  };

  // In production, use a proper JWT library like 'jsonwebtoken'
  return `mock_jwt_token_${Buffer.from(JSON.stringify(payload)).toString(
    "base64"
  )}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyOTPRequest = await request.json();

    // Validate input
    if (!body.email || !body.otp) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and OTP are required",
          },
        },
        { status: 400 }
      );
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(body.otp)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "OTP must be a 6-digit number",
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

    // Get stored OTP
    const storedOTP = otpStorage.get(body.email);
    if (!storedOTP) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "OTP_NOT_FOUND",
            message: "No verification code found. Please request a new one.",
          },
        },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    if (storedOTP.expires < Date.now()) {
      otpStorage.delete(body.email);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "OTP_EXPIRED",
            message: "Verification code has expired. Please request a new one.",
          },
        },
        { status: 410 }
      );
    }

    // Check attempt limit
    if (storedOTP.attempts >= 3) {
      otpStorage.delete(body.email);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TOO_MANY_ATTEMPTS",
            message:
              "Too many failed attempts. Please request a new verification code.",
          },
        },
        { status: 429 }
      );
    }

    // Verify OTP
    if (storedOTP.otp !== body.otp) {
      // Increment attempts
      storedOTP.attempts += 1;
      otpStorage.set(body.email, storedOTP);

      const attemptsLeft = 3 - storedOTP.attempts;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_OTP",
            message: `Invalid verification code. ${attemptsLeft} attempts remaining.`,
          },
        },
        { status: 401 }
      );
    }

    // OTP is valid - clean up and generate token
    otpStorage.delete(body.email);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate token
    const token = generateMockToken(user);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      data: {
        token,
        user,
        expires_at: expiresAt,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
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
