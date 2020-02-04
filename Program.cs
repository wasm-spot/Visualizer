using System;
using System.Diagnostics;

namespace Visualizer
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("hello world");
            if (args.Length == 0)
            {               
                System.Console.WriteLine("Please enter the file path to an assembly dll.");
            }

            Console.WriteLine(args[0]);
        }
    }
}
