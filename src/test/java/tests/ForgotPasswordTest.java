package tests;

import org.testng.annotations.Test;

import io.restassured.response.Response;
import services.AuthenticationService;

public class ForgotPasswordTest 
{
	@Test(description="Verify the Forgot Passord operation")
	public void forgotPasswordTest()
	{
		AuthenticationService authService=new AuthenticationService();
		Response response=authService.forgotPassword("kships@gmail.com");
		System.out.print(response.asPrettyString());
	}
}
