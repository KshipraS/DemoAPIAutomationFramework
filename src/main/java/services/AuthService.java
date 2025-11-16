package services;

import java.util.HashMap;

import base.BaseService;
import io.restassured.response.Response;
import models.request.LoginRequest;
import models.request.SignUpRequest;

public class AuthService extends BaseService
{
	private static final String BASE_PATH="/api/auth/";
	//private static final String BASE_URI="http://www........";  // Add this for line 23 CASE mentioned in BaseService
	
	public Response login(LoginRequest loginRequest)
	{
		return postRequest(loginRequest, BASE_PATH+"login");
		
	}
	public Response signUp(SignUpRequest signUpRequest)
	{
		return postRequest(signUpRequest, BASE_PATH+"signup");
	}
	public Response forgotPassword(String emailAddress)
	{
		HashMap<String, String> forgotPswdPayload=new HashMap<String,String>();
		forgotPswdPayload.put("email", emailAddress);
		return postRequest(forgotPswdPayload, BASE_PATH+"forgot-password");
	}
	
}
