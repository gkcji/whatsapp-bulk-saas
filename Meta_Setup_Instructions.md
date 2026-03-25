# How to Get Your WhatsApp Cloud API Credentials (Bypassing Tech Registration)

This guide takes exactly 5 minutes. You will generate the **Permanent Access Token**, **Phone Number ID**, and **Business Account ID** needed to power your WhatsApp SaaS.

## Step 1: Create a Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com/) and log in.
2. Click **My Apps** in the top right.
3. Click **Create App**.
4. Select **Other** > **Next**.
5. Select **Business** > **Next**.
6. Name your app (e.g., "SendWA Marketing") and connect it to your Facebook Business Manager account (or create one). Click **Create app**.

## Step 2: Add WhatsApp to Your App
1. You will be redirected to the App Dashboard. Scroll down and find **WhatsApp**.
2. Click **Set Up** on the WhatsApp tile.
3. Click **Continue** on the API setup page.
4. Meta will automatically provide a temporary "Test Number" and a **Temporary Access Token**.

## Step 3: Get Your Phone Number ID & Business Account ID
1. In the left-hand menu, go to **WhatsApp > API Setup**.
2. Copy the **Phone number ID**. (This is Token #1)
3. Copy the **WhatsApp Business Account ID**. (This is Token #2)

## Step 4: Get Your Permanent Access Token
The token from Step 2 expires in 24 hours. To run a SaaS, you need a Permanent Token.
1. Go to [business.facebook.com/settings](https://business.facebook.com/settings). Ensure you are logged into your chosen Business Manager account.
2. In the left menu, scroll down to **Users > System Users**. (If you don't have one, click **Add** to create one, select "Admin" role).
3. Click your System User, then click **Add Assets**. Assign your App with full permissions.
4. Click **Generate New Token**.
5. Select your App from the dropdown. 
6. Scroll down and check the boxes for:
   * `whatsapp_business_messaging`
   * `whatsapp_business_management`
7. Click **Generate Token**.
8. **Copy this massive string immediately.** Meta will never show it to you again. (This is Token #3)

## You are Done!
Take these three tokens:
1. Phone Number ID
2. Business Account ID
3. Permanent Access Token

Paste them into the **API Settings** page of your SaaS Dashboard. Your platform is now permanently connected to the Official WhatsApp Graph API without requiring heavy tech registration processes!
