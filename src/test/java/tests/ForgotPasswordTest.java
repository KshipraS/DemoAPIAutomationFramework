package tests;

import org.testng.annotations.Test;

import io.restassured.response.Response;
import services.AuthService;

public class ForgotPasswordTest 
{
	@Test(description="Verify the Forgot Passord operation")
	public void forgotPasswordTest()
	{
		AuthService authService=new AuthService();
		Response response=authService.forgotPassword("kships@gmail.com");
		System.out.print(response.asPrettyString());
	}
}
