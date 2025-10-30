package tests;	

import org.testng.Assert;
import org.testng.annotations.Listeners;
import org.testng.annotations.Test;

import base.AuthService;
import io.restassured.response.Response;
import models.request.LoginRequest;
import models.response.LoginResponse;

@Listeners(api.listeners.TestListener.class)
public class LoginAPITest3 
{
	@Test(description="Verify the Login")
	public void loginTest()
	{
		LoginRequest loginRequest=new LoginRequest("Kshipra", "Kshipra123");
		AuthService authService=new AuthService();
		//Response response=authService.login("{\"username\": \"Kshipra\",\"password\": \"Kshipra123\"}");
		Response response=authService.login(loginRequest);
		
		LoginResponse loginResponse=response.as(LoginResponse.class);  // JSON to Java object of my type, here my type is LoginResponse
		System.out.print(loginResponse.getToken());
		System.out.print(response.asPrettyString());
		
		Assert.assertTrue(loginResponse.getToken()!=null);
		Assert.assertEquals(loginResponse.getEmail(),"kships26@gmail.com");
		Assert.assertEquals(loginResponse.getId(),3096);
	}
}
