package tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import io.restassured.response.Response;
import models.request.UserProfileRequest;
import models.response.LoginResponse;
import models.response.UserProfileResponse;
import services.UserManagementService;
import util.ConfigReader;
import util.Utility;

public class UpdateProfileTest
{
	@Test
	public void updateProfile()
	{
		LoginResponse loginResponse=new Utility().doLogin(ConfigReader.get("test.username"), ConfigReader.get("test.password"));

		UserManagementService userProfileManagementService=new UserManagementService();
		Response response;
//		Response response=userProfileManagementService.getProfile(loginResponse.getToken());
//		System.out.println(response.asPrettyString());
//		
//		UserProfileResponse userProfileResponse=response.as(UserProfileResponse.class);
//		Assert.assertEquals(userProfileResponse.getUsername(), ConfigReader.get("test.username").toLowerCase());
		
		UserProfileRequest userProfileRequest=new UserProfileRequest.Builder()
																	.firstName("Disha")
																	//.email("Disha24@yahoomai.com")
																	.email(ConfigReader.get("test.email"))
																	.lastName("Pahuja")					// Update in Last name
																	.mobileNumber(ConfigReader.get("test.mobileNumber"))
																	.build();	
		
		response=userProfileManagementService.updateProfile(loginResponse.getToken(), userProfileRequest);
		System.out.println(response.asPrettyString());
	}
}
/*----------------------OUTPUT-----------------
 * {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJrc2hpcHJhIiwiaWF0IjoxNzYxNzM0Mjk1LCJleHAiOjE3NjE3Mzc4OTV9.Ao2iQuESCyf2r_rZACSmPM73T6UeLVdCuApoGn6XarQ",
    "type": "Bearer",
    "id": 3096,
    "username": "kshipra",
    "email": "kships26@gmail.com",
    "roles": [
        "ROLE_USER"
    ]
}
{
    "id": 3096,
    "username": "kshipra",
    "email": "kships26@gmail.com",
    "firstName": "Kshipra",
    "lastName": "Bhutani",
    "mobileNumber": "7838768048"
}
{
    "id": 3096,
    "username": "kshipra",
    "email": "Disha24@yahoomai.com",
    "firstName": "Disha",
    "lastName": "Pahuja",
    "mobileNumber": "9856565654"
}
PASSED: updateProfile
 */
