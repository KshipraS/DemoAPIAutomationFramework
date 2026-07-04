package util;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

/**
 * Loads test configuration (URLs, test credentials, test data) from config.properties
 * instead of hardcoding values directly inside test classes.
 * Keeps sensitive/environment-specific data in one place, easy to change per environment
 * (dev/staging/prod) without touching test code.
 */
public class ConfigReader
{
	private static final Properties properties = new Properties();

	static
	{
		try (InputStream input = ConfigReader.class.getClassLoader().getResourceAsStream("config.properties"))
		{
			if (input == null)
			{
				throw new RuntimeException("config.properties not found in classpath (src/test/resources)");
			}
			properties.load(input);
		}
		catch (IOException e)
		{
			throw new RuntimeException("Failed to load config.properties", e);
		}
	}

	public static String get(String key)
	{
		String value = properties.getProperty(key);
		if (value == null)
		{
			throw new RuntimeException("Missing config key: " + key);
		}
		return value;
	}
}
