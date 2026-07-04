package tests;

import org.testng.annotations.Test;

import io.restassured.response.Response;
import models.response.LoginResponse;
import models.response.UserProfileResponse;
import services.UserManagementService;
import util.ConfigReader;
import util.Utility;

public class GetProfileRequestTest 
{
	@Test(description="Verify Get Profile")
	public void getProfileInfo()
	{
		LoginResponse loginResponse=new Utility().doLogin(ConfigReader.get("test.username"), ConfigReader.get("test.password"));
		System.out.println(loginResponse.getToken());
		
		UserManagementService userProfileManagementService=new UserManagementService();
		Response response=userProfileManagementService.getProfile(loginResponse.getToken());
		System.out.println("Response of getProfile operation----"+response.asPrettyString());
		UserProfileResponse userProfileResponse=response.as(UserProfileResponse.class);
		System.out.println("First Name:"+ userProfileResponse.getFirstName());
		
	}
}
