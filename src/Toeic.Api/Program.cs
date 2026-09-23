using Toeic.Api;

﻿var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();
var app = builder.Build();
app.UseToeicApiPipeline();
app.MapHealthChecks("/health");
app.MapPlatformStatus();
app.Run();
