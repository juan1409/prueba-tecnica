using Microsoft.EntityFrameworkCore;
using StarterApi.Models;

namespace StarterApi.Data;

public class AppDb : DbContext
{
    public AppDb(DbContextOptions<AppDb> options) : base(options) { }
    public DbSet<TaskItem> Items => Set<TaskItem>();
}