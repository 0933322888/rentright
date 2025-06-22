import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import FacebookStrategy from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();
// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        // Link existing account with Google
        user.googleId = profile.id;
        user.socialProfile = {
          provider: 'google',
          providerData: profile._json
        };
        // Don't overwrite existing social media links, just add Google if not present
        if (!user.socialMedia) {
          user.socialMedia = {};
        }
        await user.save();
        return done(null, user);
      }

      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link existing account with Google
        user.googleId = profile.id;
        user.socialProfile = {
          provider: 'google',
          providerData: profile._json
        };
        await user.save();
        return done(null, user);
      }

      // Create new user without role - will be set during registration completion
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        profilePicture: profile.photos[0]?.value,
        role: null, // No role yet - will be set during registration completion
        termsAccepted: true, // Social login implies acceptance
        socialProfile: {
          provider: 'google',
          providerData: profile._json
        },
        socialMedia: {
          // Google doesn't provide a direct profile URL, but we can construct one
          // or leave it empty for user to fill in later
        },
        registrationComplete: false // Flag to indicate registration is not complete
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('Google OAuth credentials not configured');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:5000/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ facebookId: profile.id });
      
      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      if (profile.emails && profile.emails[0]) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link existing account with Facebook
          user.facebookId = profile.id;
          user.socialProfile = {
            provider: 'facebook',
            providerData: profile._json
          };
          // Add Facebook link to social media if not present
          if (!user.socialMedia) {
            user.socialMedia = {};
          }
          if (!user.socialMedia.facebook) {
            user.socialMedia.facebook = `https://facebook.com/${profile.id}`;
          }
          await user.save();
          return done(null, user);
        }
      }

      // Create new user without role - will be set during registration completion
      user = await User.create({
        facebookId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
        profilePicture: profile.photos?.[0]?.value,
        role: null, // No role yet - will be set during registration completion
        termsAccepted: true, // Social login implies acceptance
        socialProfile: {
          provider: 'facebook',
          providerData: profile._json
        },
        socialMedia: {
          facebook: `https://facebook.com/${profile.id}`
        },
        registrationComplete: false // Flag to indicate registration is not complete
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('Facebook OAuth credentials not configured');
}

// LinkedIn OAuth Strategy
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(new LinkedInStrategy({
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL || "http://localhost:5000/api/auth/linkedin/callback",
    scope: ['r_emailaddress', 'r_liteprofile']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ linkedinId: profile.id });
      
      if (user) {
        return done(null, user);
      }

      // Check if user exists with same email
      if (profile.emails && profile.emails[0]) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link existing account with LinkedIn
          user.linkedinId = profile.id;
          user.socialProfile = {
            provider: 'linkedin',
            providerData: profile._json
          };
          // Add LinkedIn link to social media if not present
          if (!user.socialMedia) {
            user.socialMedia = {};
          }
          if (!user.socialMedia.linkedin) {
            user.socialMedia.linkedin = profile._json.publicProfileUrl || `https://linkedin.com/in/${profile.id}`;
          }
          await user.save();
          return done(null, user);
        }
      }

      // Create new user without role - will be set during registration completion
      user = await User.create({
        linkedinId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || `${profile.id}@linkedin.com`,
        profilePicture: profile.photos?.[0]?.value,
        role: null, // No role yet - will be set during registration completion
        termsAccepted: true, // Social login implies acceptance
        socialProfile: {
          provider: 'linkedin',
          providerData: profile._json
        },
        socialMedia: {
          linkedin: profile._json.publicProfileUrl || `https://linkedin.com/in/${profile.id}`
        },
        registrationComplete: false // Flag to indicate registration is not complete
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));
} else {
  console.log('LinkedIn OAuth credentials not configured');
}

export default passport; 