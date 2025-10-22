using Microsoft.EntityFrameworkCore;
using StarterApi.Data;
using StarterApi.Models;

namespace StarterApi.Endpoints;

public static class ItemsEndpoints
{
    public static RouteGroupBuilder MapTasksApi(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/tasks").WithTags("Tasks");

        // GET /tasks
        group.MapGet("/", async (AppDb db) =>
            Results.Ok(await db.Items.AsNoTracking().ToListAsync()));

        // POST /tasks
        group.MapPost("/", async (TaskItem dto, AppDb db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return Results.BadRequest(new { error = "Title is required" });

            var entity = new TaskItem { Title = dto.Title.Trim(), IsCompleted = false };
            db.Items.Add(entity);
            await db.SaveChangesAsync();
            return Results.Created($"/tasks/{entity.Id}", entity);
        });

        // PUT /tasks/{id}/complete
        group.MapPut("/{id:int}/complete", async (int id, AppDb db) =>
        {
            var entity = await db.Items.FindAsync(id);
            if (entity is null)
                return Results.NotFound(new { error = "Task not found" });

            entity.IsCompleted = true;
            await db.SaveChangesAsync();
            return Results.Ok(new { ok = true });
        });

        // DELETE /tasks/{id}
        group.MapDelete("/{id:int}", async (int id, AppDb db) =>
        {
            var entity = await db.Items.FindAsync(id);
            if (entity is null)
                return Results.NotFound(new { error = "Task not found" });

            db.Items.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return group;
    }
}
