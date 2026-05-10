package com.dailyeng.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Parses the Prisma-style DATABASE_URL (postgresql://user:pass@host:port/db)
 * and configures a HikariCP DataSource. Pool settings are read from
 * {@code spring.datasource.hikari.*} in application.yml.
 *
 * Disabled in test profile — tests use spring.datasource.* from application-test.yml.
 */
@Configuration
@Profile("!test")
public class DatabaseConfig {

    @Value("${DATABASE_URL:postgresql://postgres:postgres@localhost:5432/dailyeng}")
    private String databaseUrl;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")
    private int maxPoolSize;

    @Value("${spring.datasource.hikari.minimum-idle:2}")
    private int minIdle;

    @Value("${spring.datasource.hikari.idle-timeout:300000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.connection-timeout:10000}")
    private long connectionTimeout;

    @Value("${spring.datasource.hikari.max-lifetime:1800000}")
    private long maxLifetime;

    @Value("${spring.datasource.hikari.leak-detection-threshold:60000}")
    private long leakDetectionThreshold;

    @Bean
    public DataSource dataSource() throws URISyntaxException {
        URI dbUri = new URI(databaseUrl);

        String username = null;
        String password = null;
        if (dbUri.getUserInfo() != null) {
            String[] credentials = dbUri.getUserInfo().split(":", 2);
            username = credentials[0];
            if (credentials.length > 1) {
                password = credentials[1];
            }
        }

        String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + 
                       (dbUri.getPort() != -1 ? ":" + dbUri.getPort() : "") + 
                       dbUri.getPath() + 
                       (dbUri.getQuery() != null ? "?" + dbUri.getQuery() : "");

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        if (username != null) config.setUsername(username);
        if (password != null) config.setPassword(password);
        
        config.setDriverClassName("org.postgresql.Driver");
        config.addDataSourceProperty("prepareThreshold", "0");
        config.setMaximumPoolSize(maxPoolSize);
        config.setMinimumIdle(minIdle);
        config.setIdleTimeout(idleTimeout);
        config.setConnectionTimeout(connectionTimeout);
        config.setMaxLifetime(maxLifetime);
        config.setLeakDetectionThreshold(leakDetectionThreshold);

        return new HikariDataSource(config);
    }

    @Bean
    public FlywayMigrationStrategy flywayMigrationStrategy() {
        return flyway -> {
            // Repair the history table before migrating. 
            // This fixes checksum mismatches and aligns manual DB changes with the code.
            flyway.repair();
            flyway.migrate();
        };
    }
}
