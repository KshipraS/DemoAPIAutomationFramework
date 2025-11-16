package util;

import io.restassured.response.Response;
import models.request.LoginRequest;
import models.response.LoginResponse;
import services.AuthService;

public class Utility
{
	public LoginResponse doLogin(String uname, String pswd)
	{
		AuthService authService=new AuthService();
		Response response=authService.login(new LoginRequest(uname, pswd));
		LoginResponse loginResponse=response.as(LoginResponse.class);
		System.out.println(response.asPrettyString());
		
		return loginResponse;
	}
	
}
